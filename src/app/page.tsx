export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex items-center gap-2 text-accent">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <polygon points="15.5 8.5 11 11 8.5 15.5 13 13 15.5 8.5" fill="currentColor" stroke="none" />
        </svg>
        <span className="text-sm font-medium tracking-wide">Norte</span>
      </div>

      <h1 className="font-serif text-5xl leading-tight">Sua bússola financeira</h1>

      <p className="max-w-md text-muted">
        Registrar gastos, economias e investimentos — e enxergar o quão perto
        você está de não depender do trabalho.
      </p>

      <span className="text-xs text-muted">Fase 0 · em construção</span>
    </main>
  );
}
