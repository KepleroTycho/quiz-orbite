import { useState } from "react";
import { ArrowLeft, BookOpen, Orbit, Sun, CalendarDays } from "lucide-react";
import { SunFromPlanets } from "./components/SunFromPlanets";
import { PlanetsAtBirth } from "./components/PlanetsAtBirth";
import { AgeOnPlanets } from "./components/AgeOnPlanets";

export default function Laboratory({ onBack }: { onBack: () => void }) {
  const [birth, setBirth] = useState("");
  return (
    <main className="relative min-h-screen overflow-clip bg-[linear-gradient(180deg,#02061a_0%,#081346_55%,#12246e_100%)] text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(1px_1px_at_20px_30px,var(--foreground),transparent),radial-gradient(1px_1px_at_90px_120px,var(--primary),transparent)] [background-size:200px_160px]" />
      <div className="relative mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6 sm:py-12">
        <header className="text-center">
          <button onClick={onBack} className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-btn border border-border bg-card/70 px-4 text-sm hover:border-primary">
            <ArrowLeft className="size-4" /> Torna alla scelta
          </button>
          <p className="mb-3 flex items-center justify-center gap-2 text-sm uppercase tracking-[0.25em] text-primary"><Orbit className="size-4" /> Laboratorio astronomico</p>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">Esplora il Sistema solare</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Tre esperienze interattive per osservare il moto dei pianeti e le leggi di Keplero.</p>
        </header>

        <section className="space-y-5">
          <div className="flex items-center gap-3"><Sun className="size-6 text-primary" /><div><h2 className="font-display text-2xl font-semibold">Il Sole visto da ogni pianeta</h2><p className="text-sm text-muted-foreground">Confronta dimensioni apparenti e distanza dal Sole.</p></div></div>
          <div className="rounded-card border border-border bg-card/40 p-3 sm:p-5"><SunFromPlanets /></div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center gap-3"><CalendarDays className="size-6 text-primary" /><div><h2 className="font-display text-2xl font-semibold">Dov’erano i pianeti quando sei nato?</h2><p className="text-sm text-muted-foreground">Ricostruisci la posizione dei pianeti a partire dalla data scelta.</p></div></div>
          <div className="rounded-card border border-border bg-card/40 p-3 sm:p-5 space-y-4">
            <label htmlFor="birth" className="block text-sm font-medium">Data di nascita</label>
            <input id="birth" type="date" min="1800-01-01" max={new Date().toISOString().slice(0, 10)} value={birth} onChange={(e) => setBirth(e.target.value)} className="h-12 w-full max-w-xs rounded-input border border-border bg-card px-4 text-foreground outline-none [color-scheme:dark] focus:border-primary" />
            <PlanetsAtBirth birth={birth} />
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center gap-3"><BookOpen className="size-6 text-primary" /><div><h2 className="font-display text-2xl font-semibold">La tua età sui pianeti</h2><p className="text-sm text-muted-foreground">Scopri quanti anni avresti sugli altri pianeti.</p></div></div>
          <div className="rounded-card border border-border bg-card/40 p-3 sm:p-5"><AgeOnPlanets value={birth} onChange={setBirth} /></div>
        </section>
      </div>
    </main>
  );
}
