import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { AuthController } from "./controllers/AuthController.js";
import { DisponibilidadController } from "./controllers/DisponibilidadController.js";
import { ICalController } from "./controllers/ICalController.js";
import { ReservaController } from "./controllers/ReservaController.js";
import { ServicioController } from "./controllers/ServicioController.js";
import { Sistema } from "./domain/Sistema.js";
import { authAdmin } from "./middlewares/authMiddleware.js";
import { ActualizadorDisponibilidad } from "./patterns/observer/ActualizadorDisponibilidad.js";
import { NotificacionCliente } from "./patterns/observer/NotificacionCliente.js";
import { NotificacionOwner } from "./patterns/observer/NotificacionOwner.js";
import { ReservaManager } from "./patterns/observer/ReservaManager.js";
import { BloqueoCalendarioRepository } from "./repositories/BloqueoCalendarioRepository.js";
import { ClienteRepository } from "./repositories/ClienteRepository.js";
import { HistorialReservaRepository } from "./repositories/HistorialReservaRepository.js";
import { ReservaRepository } from "./repositories/ReservaRepository.js";
import { ServicioRepository } from "./repositories/ServicioRepository.js";
import { UsuarioRepository } from "./repositories/UsuarioRepository.js";
import { AuthService } from "./services/AuthService.js";
import { DisponibilidadApiService } from "./services/DisponibilidadApiService.js";
import { DisponibilidadService } from "./services/DisponibilidadService.js";
import { ICalService } from "./services/ICalService.js";
import { ReservaService } from "./services/ReservaService.js";
import { ServicioService } from "./services/ServicioService.js";

export function createApp() {
  const servicioRepo = new ServicioRepository();
  const reservaRepo = new ReservaRepository();
  const clienteRepo = new ClienteRepository();
  const historialRepo = new HistorialReservaRepository();
  const usuarioRepo = new UsuarioRepository();
  const bloqueoRepo = new BloqueoCalendarioRepository();

  const disponibilidad = new DisponibilidadService();
  const disponibilidadApi = new DisponibilidadApiService();

  const reservaManager = new ReservaManager();
  reservaManager.agregarObserver(new NotificacionCliente());
  reservaManager.agregarObserver(new NotificacionOwner(env.SUPPORT_EMAIL));
  reservaManager.agregarObserver(new ActualizadorDisponibilidad());

  const reservaService = new ReservaService(
    reservaRepo,
    clienteRepo,
    servicioRepo,
    historialRepo,
    disponibilidad,
    reservaManager
  );

  const servicioService = new ServicioService(servicioRepo);
  const icalService = new ICalService(servicioRepo, bloqueoRepo);
  const authService = new AuthService(usuarioRepo);

  void new Sistema(servicioService, reservaService);

  const authController = new AuthController(authService);
  const servicioController = new ServicioController(servicioService);
  const reservaController = new ReservaController(reservaService);
  const disponibilidadController = new DisponibilidadController(disponibilidadApi);
  const icalController = new ICalController(icalService);

  const app = express();
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    })
  );
  app.use(express.json());

  const reservaLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/auth/login", authController.login);

  app.get("/api/servicios", servicioController.list);
  app.get("/api/servicios/map", servicioController.map);
  app.get(
    "/api/servicios/:id/disponibilidad",
    disponibilidadController.get
  );
  app.get("/api/servicios/:id/calendar.ics", icalController.exportCal);
  app.post(
    "/api/servicios/:id/ical-import",
    authAdmin,
    icalController.importPost
  );
  app.get("/api/servicios/:id", servicioController.getOne);
  app.post("/api/servicios", authAdmin, servicioController.create);
  app.put("/api/servicios/:id", authAdmin, servicioController.update);
  app.delete("/api/servicios/:id", authAdmin, servicioController.remove);

  app.post("/api/reservas", reservaLimiter, reservaController.create);
  app.get("/api/reservas", authAdmin, reservaController.list);

  return app;
}
