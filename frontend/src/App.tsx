import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminServicios } from "./pages/AdminServicios";
import { Contact } from "./pages/Contact";
import { Home } from "./pages/Home";
import { ServicioDetail } from "./pages/ServicioDetail";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/servicio/:id" element={<ServicioDetail />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/servicios" element={<AdminServicios />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        Rentals Miami — demo marketplace
      </footer>
    </div>
  );
}
