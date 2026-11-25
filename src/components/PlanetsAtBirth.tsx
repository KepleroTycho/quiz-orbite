import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  AU_KM,
  EPHEM_PLANETS,
  LIGHT_SECONDS_PER_AU,
  distance3D,
  julianDay,
  orbitPhase,
  orbitPoints,
  positionAt,
  speedKmS,
} from "@/lib/ephemeris";
import { daysBetween, localToday, type YMD } from "@/lib/kepler";

const C = 300;
const R = 280;
const DAY_MS = 86400000;
const SPEEDS = [
  { v: "w", label: "1 sett.", days: 7 },
  { v: "m", label: "1 mese", days: 30.4375 },
  { v: "y", label: "1 anno", days: 365.25 },
  { v: "5y", label: "5 anni", days: 1826.25 },
] as const;

type SpeedKey = (typeof SPEEDS)[number]["v"];
type ScaleMode = "all" | "inner";

function num(n: number, d: number) {
  return n.toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function parseBirth(value: string): { ymd: YMD | null; error: string | null } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return { ymd: null, error: null };
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const t = new Date(Date.UTC(y, mo - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return { ymd: null, error: null };
  if (y < 1800) {
    return { ymd: null, error: "Gli elementi usati qui valgono dal 1800: scegli una data da quell'anno in poi." };
  }
  return { ymd: { y, m: mo, d }, error: null };
}

function ageText(birth: YMD, cur: Date) {
  const cy = cur.getUTCFullYear();
  const cm = cur.getUTCMonth() + 1;
  const cd = cur.getUTCDate();
  const months = Math.max(0, (cy - birth.y) * 12 + (cm - birth.m) - (cd < birth.d ? 1 : 0));
  const y = Math.floor(months / 12);
  const mo = months % 12;
  const ys = y === 1 ? "1 anno" : `${y} anni`;
  const ms = mo === 1 ? "1 mese" : `${mo} mesi`;
  if (y === 0 && mo === 0) return "meno di un mese";
  if (y === 0) return ms;
  if (mo === 0) return ys;
  return `${ys} e ${ms}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function PlanetsAtBirth({ birth }: { birth: string }) {
  const [today, setToday] = useState<YMD | null>(null);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<SpeedKey>("y");
  const [scale, setScale] = useState<ScaleMode>("all");
  const [trails, setTrails] = useState(false);
  const speedRef = useRef(1826.25);
  speedRef.current = SPEEDS.find((s) => s.v === speed)?.days ?? 365.25;

  useEffect(() => {
    setToday(localToday());
  }, []);

  const { ymd, error } = useMemo(() => parseBirth(birth), [birth]);
  const total = ymd && today ? daysBetween(ymd, today) : null;
  const future = ymd !== null && total !== null && total < 0;
  const valid = ymd !== null && total !== null && total >= 0;
  const maxT = valid ? total : 0;

  useEffect(() => {
    setT(0);
    setPlaying(false);
  }, [birth]);

  useEffect(() => {
    if (!playing || !valid) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      let done = false;
      setT((cur) => {
        const nx = cur + dt * speedRef.current;
        if (nx >= maxT) {
          done = true;
          return maxT;
        }
        return nx;
      });
      if (done) setPlaying(false);
      else raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, valid, maxT]);

  const birthJD = valid && ymd ? julianDay(ymd.y, ymd.m, ymd.d, 12) : 0;
  const jd = birthJD + t;
  const jdKey = Math.round(jd);

  const pos = useMemo(() => (valid ? EPHEM_PLANETS.map((_, i) => positionAt(i, jd)) : []), [valid, jd]);
  const birthPos = useMemo(() => (valid ? EPHEM_PLANETS.map((_, i) => positionAt(i, birthJD)) : []), [valid, birthJD]);
  const orbits = useMemo(
    () => (valid ? EPHEM_PLANETS.map((_, i) => orbitPoints(i, jdKey, 180)) : []),
    [valid, jdKey],
  );

  function project(x: number, y: number): { px: number; py: number; out: boolean; ang: number } {
    const rr = Math.sqrt(x * x + y * y);
    const ang = Math.atan2(y, x);
    if (rr === 0) return { px: C, py: C, out: false, ang };
    const rpx = scale === "all" ? R * Math.sqrt(rr / 31) : (R * rr) / 1.8;
    const k = rpx / rr;
    return { px: C + x * k, py: C - y * k, out: scale === "inner" && rr > 1.8, ang };
  }

  const trailPaths = useMemo(() => {
    if (!valid || !trails || t < 1) return [];
    const n = 100;
    return EPHEM_PLANETS.map((_, i) => {
      const pts: string[] = [];
      let skipped = false;
      for (let s = 0; s <= n; s++) {
        const p = positionAt(i, birthJD + (t * s) / n);
        const rr = p.rxy;
        if (scale === "inner" && rr > 1.8) {
          skipped = true;
          continue;
        }
        const rpx = scale === "all" ? R * Math.sqrt(rr / 31) : (R * rr) / 1.8;
        const k = rr === 0 ? 0 : rpx / rr;
        pts.push(`${(C + p.x * k).toFixed(1)} ${(C - p.y * k).toFixed(1)}`);
      }
      return { i, d: skipped && pts.length < 2 ? "" : `M ${pts.join(" L ")}` };
    });
  }, [valid, trails, jdKey, scale, birthJD, t]);

  if (!ymd && !error && !future) {
    return (
      <Shell>
        <p className="rounded-card border border-border bg-card/70 p-4 text-sm text-muted-foreground">
          Inserisci la tua data di nascita nel campo «Data di nascita» qui sopra per vedere dove si trovavano i pianeti.
        </p>
      </Shell>
    );
  }
  if (error) {
    return (
      <Shell>
        <p role="status" className="rounded-card border border-border bg-card/70 p-4 text-sm text-muted-foreground">
          {error}
        </p>
      </Shell>
    );
  }
  if (!valid || !ymd || total === null) {
    return (
      <Shell>
        <p role="status" className="rounded-card border border-border bg-card/70 p-4 text-sm text-muted-foreground">
          {future
            ? "Questa data non è ancora arrivata: scegli un giorno tra il 1800 e oggi."
            : "Un attimo, controllo la data di oggi…"}
        </p>
      </Shell>
    );
  }

  const curDate = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d) + t * DAY_MS);
  const earth = pos[2];
  const v = speedKmS(earth.r, earth.a);
  const phase = orbitPhase(earth.r, earth.a, earth.e);
  const phaseText =
    phase === "perihelion"
      ? "vicina al perielio, quindi più veloce"
      : phase === "aphelion"
        ? "vicina all'afelio, quindi più lenta"
        : "a distanza intermedia";

  const dists = EPHEM_PLANETS.map((p, i) => ({ i, name: p.name, au: distance3D(earth, pos[i]) })).filter((x) => x.i !== 2);
  const nearest = dists.reduce((a, b) => (b.au < a.au ? b : a));
  const marsAu = dists.find((x) => x.i === 3)?.au ?? 0;
  const turns = t / 365.25;
  const atBirth = t < 1;
  const eb = project(birthPos[2].x, birthPos[2].y);
  const ep = project(earth.x, earth.y);

  return (
    <Shell>
      <p className="text-xs text-muted-foreground">La data resta sul tuo dispositivo: non viene inviata né salvata.</p>

      <div className="rounded-card border border-border bg-card/70 p-2 backdrop-blur-sm sm:p-4">
        <svg
          viewBox="0 0 600 600"
          className="mx-auto block aspect-square w-full max-w-xl"
          role="img"
          aria-label={`Le posizioni degli otto pianeti attorno al Sole il ${formatDate(curDate)}, viste dal nord dell'eclittica.`}
        >
          <defs>
            <radialGradient id="pab-sun">
              <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="0.3" stopColor="#fff6e0" stopOpacity="0.55" />
              <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
            </radialGradient>
          </defs>
          <line x1={C} y1={C} x2={C + R + 14} y2={C} className="stroke-muted-foreground" strokeOpacity="0.6" strokeDasharray="2 5" />
          <text x={C + R + 14} y={C - 7} textAnchor="end" fontSize="10.5" className="fill-muted-foreground">
            0° (direzione dell'equinozio)
          </text>

          {EPHEM_PLANETS.map((p, i) => {
            const pts = orbits[i].map((q) => project(q.x, q.y));
            if (scale === "inner" && pts.some((q) => q.out)) return null;
            return (
              <path
                key={p.name}
                d={`M ${pts.map((q) => `${q.px.toFixed(1)} ${q.py.toFixed(1)}`).join(" L ")}`}
                fill="none"
                stroke={p.color}
                strokeOpacity="0.35"
                strokeWidth="1"
              />
            );
          })}

          {trails &&
            trailPaths.map(
              (tp) =>
                tp.d && (
                  <path key={tp.i} d={tp.d} fill="none" stroke={EPHEM_PLANETS[tp.i].color} strokeOpacity="0.7" strokeWidth="1.6" />
                ),
            )}

          {!atBirth && (
            <g>
              <line x1={C} y1={C} x2={eb.px} y2={eb.py} stroke="#ffffff" strokeOpacity="0.6" strokeDasharray="4 4" />
              {EPHEM_PLANETS.map((p, i) => {
                const b = project(birthPos[i].x, birthPos[i].y);
                if (b.out) return null;
                return <circle key={p.name} cx={b.px} cy={b.py} r="4.5" fill="none" stroke={p.color} strokeWidth="1.4" />;
              })}
            </g>
          )}

          <circle cx={C} cy={C} r="46" fill="url(#pab-sun)" />
          <circle cx={C} cy={C} r="9" fill="#fff6e0" />

          {EPHEM_PLANETS.map((p, i) => {
            const q = project(pos[i].x, pos[i].y);
            if (q.out) {
              const ax = C + 286 * Math.cos(q.ang);
              const ay = C - 286 * Math.sin(q.ang);
              const lx = C + 258 * Math.cos(q.ang);
              const ly = C - 258 * Math.sin(q.ang);
              return (
                <g key={p.name}>
                  <polygon
                    points="0,-6 5,5 -5,5"
                    fill={p.color}
                    transform={`translate(${ax.toFixed(1)} ${ay.toFixed(1)}) rotate(${(90 - (q.ang * 180) / Math.PI).toFixed(1)})`}
                  />
                  <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill={p.color}>
                    {p.name}
                  </text>
                </g>
              );
            }
            const isEarth = i === 2;
            return (
              <g key={p.name}>
                {isEarth && <circle cx={q.px} cy={q.py} r="12" fill="none" stroke="#ffffff" strokeWidth="1.6" />}
                <circle cx={q.px} cy={q.py} r={isEarth ? 6 : i >= 4 ? 5.5 : 4.5} fill={p.color} />
                <text x={q.px + 9} y={q.py - 8} fontSize="11" fill={p.color}>
                  {p.name}
                </text>
              </g>
            );
          })}

          {atBirth && (
            <g>
              <line x1={ep.px} y1={ep.py} x2={ep.px + (ep.px > 400 ? -26 : 26)} y2={ep.py + 28} stroke="#ffffff" strokeOpacity="0.8" />
              <text
                x={ep.px + (ep.px > 400 ? -30 : 30)}
                y={ep.py + 36}
                textAnchor={ep.px > 400 ? "end" : "start"}
                fontSize="13"
                fontWeight="600"
                fill="#ffffff"
              >
                Tu sei nato qui
              </text>
            </g>
          )}
        </svg>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {scale === "all"
            ? "Scala compressa per far stare tutto: gli angoli sono veri, le distanze no."
            : "Scala lineare fino a 1,8 UA: i pianeti più lontani sono indicati da una freccia sul bordo."}
        </p>
      </div>

      <div className="grid gap-3">
        <div role="group" aria-label="Scala del disegno" className="grid grid-cols-2 gap-1 rounded-btn border border-border bg-card/70 p-1">
          {(
            [
              ["all", "Tutti"],
              ["inner", "Pianeti interni"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={scale === k}
              onClick={() => setScale(k)}
              className={cn(
                "min-h-11 rounded-btn px-3 text-sm font-medium transition-colors",
                scale === k ? "bg-primary text-primary-foreground" : "hover:bg-primary/10",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="pab-time" className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium">Dalla nascita a oggi</span>
            <span className="font-mono text-primary">{formatDate(curDate)}</span>
          </label>
          <input
            id="pab-time"
            type="range"
            min={0}
            max={maxT}
            step={1}
            value={Math.round(t)}
            disabled={maxT === 0}
            onChange={(e) => {
              setPlaying(false);
              setT(Number(e.target.value));
            }}
            aria-valuetext={formatDate(curDate)}
            className="h-11 w-full accent-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={maxT === 0}
            onClick={() => {
              if (playing) setPlaying(false);
              else {
                if (t >= maxT) setT(0);
                setPlaying(true);
              }
            }}
            className="flex min-h-11 items-center gap-2 rounded-btn border border-border bg-card px-4 text-sm font-medium hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            {playing ? "Pausa" : "Riproduci"}
          </button>
          <div role="group" aria-label="Velocità: tempo che passa in un secondo" className="grid grid-cols-4 gap-1">
            {SPEEDS.map((s) => (
              <button
                key={s.v}
                type="button"
                aria-pressed={speed === s.v}
                onClick={() => setSpeed(s.v)}
                className={cn(
                  "min-h-11 rounded-btn border px-2 text-xs font-medium sm:px-3 sm:text-sm",
                  speed === s.v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">La velocità indica il tempo che passa in un secondo.</p>

        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={trails} onChange={(e) => setTrails(e.target.checked)} className="size-5 accent-primary" />
          Mostra le scie
        </label>
      </div>

      <div aria-live={playing ? "off" : "polite"} className="space-y-4">
        <div className="grid grid-cols-3 gap-2 rounded-card border border-border bg-card/70 p-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Data</p>
            <p className="text-sm font-medium">{formatDate(curDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Età</p>
            <p className="text-sm font-medium">{ageText(ymd, curDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Giri della Terra</p>
            <p className="font-mono text-sm font-medium">
              {Math.floor(turns)} <span className="text-muted-foreground">({num(turns, 2)})</span>
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-card border border-border bg-card/70 p-4 text-sm">
          <h3 className="font-display text-lg font-semibold">La Terra in questo momento</h3>
          <p>
            Distanza dal Sole: <strong className="font-mono text-primary">{num(earth.r, 4)} UA</strong> · velocità:{" "}
            <strong className="font-mono text-primary">{num(v, 2)} km/s</strong>
          </p>
          <p>
            Longitudine eliocentrica: <span className="font-mono">{num(earth.lon, 2)}°</span>. Oggi la Terra è {phaseText}.
          </p>
          <p className="text-muted-foreground">
            Seconda legge di Keplero: la linea Sole-pianeta spazza aree uguali in tempi uguali, quindi vicino al Sole il
            pianeta corre di più e lontano rallenta.
          </p>
        </div>

        <div className="overflow-hidden rounded-card border border-border bg-card/70">
          <div className="grid grid-cols-[1fr_4rem_5rem_4.5rem] items-center gap-2 border-b border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground">
            <span>Dalla Terra a</span>
            <span className="text-right">UA</span>
            <span className="text-right">Mln km</span>
            <span className="text-right">Luce</span>
          </div>
          <div className="divide-y divide-border text-sm">
            {dists.map((r) => (
              <div
                key={r.name}
                className={cn(
                  "grid grid-cols-[1fr_4rem_5rem_4.5rem] items-center gap-2 px-3 py-2",
                  r.i === nearest.i && "bg-primary/20",
                )}
              >
                <span className={cn(r.i === nearest.i && "font-semibold text-primary")}>
                  {r.name}
                  {r.i === nearest.i && <span className="ml-1 text-xs">· più vicino</span>}
                </span>
                <span className="text-right font-mono">{num(r.au, r.au < 10 ? 3 : 2)}</span>
                <span className="text-right font-mono">{num((r.au * AU_KM) / 1e6, 1)}</span>
                <span className="text-right font-mono text-xs">{lightShort(r.au * LIGHT_SECONDS_PER_AU)}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Un messaggio radio verso Marte ci avrebbe messo{" "}
          <strong className="text-foreground">{num((marsAu * LIGHT_SECONDS_PER_AU) / 60, 1)} minuti</strong>.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Posizioni calcolate con gli elementi NASA/JPL per 1800-2050: errori al massimo di circa 10 primi d'arco (Saturno),
        invisibili nel disegno.
      </p>
    </Shell>
  );
}

function lightShort(s: number) {
  if (s < 3600) return `${num(s / 60, 1)} min`;
  return `${num(s / 3600, 2)} h`;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">Dov'erano i pianeti quando sei nato?</h2>
        <p className="text-sm text-muted-foreground">
          È astronomia, non astrologia: ecco dove si trovavano davvero i pianeti. Sono le posizioni che Tycho Brahe
          misurava a occhio e che Keplero trasformò in leggi.
        </p>
      </div>
      {children}
    </section>
  );
}
