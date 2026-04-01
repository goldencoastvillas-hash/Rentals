import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@rentals.local";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const name = process.env.ADMIN_NAME ?? "Admin";

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.usuario.upsert({
    where: { email },
    update: { passwordHash, nombre: name },
    create: {
      email,
      nombre: name,
      passwordHash,
      rol: "ADMIN",
    },
  });

  const existing = await prisma.servicio.count();
  if (existing === 0) {
    await prisma.servicio.createMany({
      data: [
      {
        tipo: "CASA",
        nombre: "Villa Coral Gables",
        descripcion: "Casa con piscina cerca de Miracle Mile, Miami.",
        precio: 320,
        ubicacion: "Coral Gables, Miami, FL",
        lat: 25.7215,
        lng: -80.2684,
        habitaciones: 4,
        banos: 3,
        aireAcondicionado: true,
        petFriendly: true,
        piscina: true,
        lavadora: true,
        parking: true,
      },
      {
        tipo: "CASA",
        nombre: "Loft Brickell",
        descripcion: "Loft moderno con vista a la bahía.",
        precio: 210,
        ubicacion: "Brickell, Miami, FL",
        lat: 25.765,
        lng: -80.196,
        habitaciones: 2,
        banos: 2,
        aireAcondicionado: true,
        petFriendly: false,
        piscina: false,
        lavadora: true,
        parking: true,
      },
      {
        tipo: "CARRO",
        nombre: "Tesla Model 3",
        descripcion: "Eléctrico, autopilot básico.",
        precio: 85,
        marca: "Tesla",
        modelo: "Model 3",
        anio: 2023,
      },
      {
        tipo: "CARRO",
        nombre: "Jeep Wrangler",
        descripcion: "Ideal para Miami Beach.",
        precio: 95,
        marca: "Jeep",
        modelo: "Wrangler",
        anio: 2022,
      },
    ],
    });
  }

  console.log("Seed OK: admin + sample servicios");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
