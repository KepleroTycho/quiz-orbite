import { useEffect, useMemo, useState } from "react";
import {
  PLANETS,
  ageOn,
  daysBetween,
  formatAge,
  formatDateIt,
  localToday,
  logBarPercent,
  nextBirthday,
  parseDateInput,
  toInputValue,
  type YMD,
} from "@/lib/kepler";

function num(n: number, d: number) {
  return n.toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function AgeOnPlanets({ value: controlled, onChange }: { value?: string; onChange?: (v: string) => void } = {}) {
  const [own, setOwn] = useState("");
  const value = controlled ?? own;
  const setValue = onChange ?? setOwn;
  const [today, setToday] = useState<YMD | null>(null);

  useEffect(() => {
    setToday(localToday());
  }, []);

  const birth = useMemo(() => parseDateInput(value), [value]);
  const days = birth && today ? daysBetween(birth, today) : null;
  const future = days !== null && days < 0;

  const rows = useMemo(() => {
    if (!birth || days === null || days < 0) return [];
    return PLANETS.map((p) => {
      const age = ageOn(days, p.periodDays);
      return {
        ...p,
        age,
        birthdays: Math.floor(age),
        next: formatDateIt(nextBirthday(birth, age, p.periodDays)),
        bar: logBarPercent(p.periodDays),
      };
    });
  }, [birth, days]);

  const first = rows[0];
  const last = rows[rows.length - 1];

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">La tua età sui pianeti</h2>
        <p className="text-sm text-muted-foreground">
          Più un pianeta è lontano dal Sole, più il suo anno è lungo: Keplero lo capì dalle misure di Brahe su Marte.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="birth" className="block text-sm font-medium">Data di nascita</label>
        <input
          id="birth"
          type="date"
          value={value}
          min="1800-01-01"
          max={today ? toInputValue(today) : undefined}
          onChange={(e) => setValue(e.target.value)}
          className="h-12 w-full rounded-input border border-border bg-card px-4 text-foreground outline-none [color-scheme:dark] focus:border-primary"
        />
        <p className="text-xs text-muted-foreground">La data resta sul tuo dispositivo: non viene inviata né salvata.</p>
        {future && (
          <p className="rounded-card border border-border bg-card/70 p-3 text-sm text-muted-foreground">
            Questa data non è ancora arrivata: scegli un giorno di oggi o del passato e vedrai la tua età sui pianeti.
          </p>
        )}
      </div>

      {rows.length > 0 && first && last && days !== null && (
        <div className="space-y-5">
          <p className="rounded-card border border-primary/40 bg-primary/10 p-4 text-sm leading-relaxed">
            Hai vissuto <strong className="font-mono">{num(days, 0)}</strong> giorni. Su {first.name} hai{" "}
            <strong className="text-primary">{formatAge(first.age)}</strong> anni, su {last.name} solo{" "}
            <strong className="text-primary">{formatAge(last.age)}</strong>: stessi giorni, anni di durata molto diversa.
          </p>

          <ol className="divide-y divide-border overflow-hidden rounded-card border border-border bg-card/70 backdrop-blur-sm">
            {rows.map((r) => (
              <li key={r.name} className="space-y-2 px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{r.name}</span>
                  <span className="font-mono text-xl font-semibold text-primary">{formatAge(r.age)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border" aria-hidden>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${r.bar}%` }} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {r.birthdays === 0
                    ? "Non hai ancora festeggiato il primo compleanno."
                    : `Compleanni festeggiati: ${r.birthdays}.`}{" "}
                  Il prossimo: <span className="text-foreground">{r.next}</span>.
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  Anno = {num(r.periodDays, r.periodDays < 1000 ? 1 : 0)} giorni terrestri
                </p>
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground">Le barrette mostrano la lunghezza dell'anno in scala logaritmica.</p>
        </div>
      )}
    </section>
  );
}
