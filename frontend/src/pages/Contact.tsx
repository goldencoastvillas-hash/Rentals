export function Contact() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Contáctanos</h1>
      <p className="mt-4 text-slate-600">
        Escríbenos a{" "}
        <a className="text-teal-700 underline" href="mailto:soporte@rentals.local">
          soporte@rentals.local
        </a>{" "}
        o llama al +1 (305) 000-0000.
      </p>
    </div>
  );
}
