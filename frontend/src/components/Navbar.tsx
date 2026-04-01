import { useState } from "react";
import { Link } from "react-router-dom";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-teal-700">
          Rentals Miami
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link className="text-slate-700 hover:text-teal-700" to="/#casas">
            Casas
          </Link>
          <Link className="text-slate-700 hover:text-teal-700" to="/#carros">
            Carros
          </Link>
          <Link className="text-slate-700 hover:text-teal-700" to="/#info">
            Información
          </Link>
          <Link className="text-slate-700 hover:text-teal-700" to="/contacto">
            Contáctanos
          </Link>
          <Link
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
            to="/admin/login"
          >
            Admin
          </Link>
        </nav>
        <button
          type="button"
          className="rounded-md p-2 md:hidden"
          aria-label="Menú"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block h-0.5 w-6 bg-slate-800" />
          <span className="my-1 block h-0.5 w-6 bg-slate-800" />
          <span className="block h-0.5 w-6 bg-slate-800" />
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/#casas" onClick={() => setOpen(false)}>
              Casas
            </Link>
            <Link to="/#carros" onClick={() => setOpen(false)}>
              Carros
            </Link>
            <Link to="/#info" onClick={() => setOpen(false)}>
              Información
            </Link>
            <Link to="/contacto" onClick={() => setOpen(false)}>
              Contáctanos
            </Link>
            <Link
              to="/admin/login"
              className="font-medium text-teal-700"
              onClick={() => setOpen(false)}
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
