import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  EARTH_DIAMETER_DEG,
  FIELD_DEG,
  MOON_DIAMETER_DEG,
  SUN_PLANETS,
  angularDiameterDeg,
  aphelion,
  distanceToSlider,
  fmt,
  fmtLight,
  formatDuration,
  lightRatio,
  lightSeconds,
  mulberry32,
  perihelion,
  sliderToDistance,
} from "@/lib/sun";

type SkyKey = "space" | "venus" | "earthDay" | "earthSunset" | "marsDay" | "marsSunset";
type Point = "peri" | "mean" | "aph";

const STARS = (() => {
  const rnd = mulberry32(20240611);
  return Array.from({ length: 120 }, (_, i) => ({
    x: rnd(),
    y: rnd(),
    r: 0.4 + rnd() * rnd() * 1.6,
    o: 0.3 + rnd() * 0.7,
    tw: i % 3 === 0,
  }));
})();

const PLANET_LOOK: { base: string; bands?: string; ring?: boolean }[] = [
  { base: "#9a8f87" },
  { base: "#e7c98f" },
  { base: "#3f7fd0" },
  { base: "#c1522a" },
  { base: "#d9b38c", bands: "#b98a62" },
  { base: "#e6d3a3", ring: true },
  { base: "#9fdfe3" },
  { base: "#4a66e0" },
];

function sphereStyle(i: number): React.CSSProperties {
  const { base, bands } = PLANET_LOOK[i];
  const shade = `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${base} 55%, white), ${base} 55%, color-mix(in srgb, ${base} 40%, black) 100%)`;
  if (!bands) return { background: shade };
  const stripes = `repeating-linear-gradient(0deg, ${bands}99 0 5px, transparent 5px 11px)`;
  return { background: `${stripes}, ${shade}` };
}


function caption(i: number): string {
  const p = SUN_PLANETS[i];
  const th = angularDiameterDeg(p.a);
  const ratio = th / EARTH_DIAMETER_DEG;
  const light = lightRatio(p.a);
  const t = lightSeconds(p.a);
  if (i === 2) {
    return `Il nostro riferimento: il Sole misura ${fmt(th, 3)}° e la sua luce ci mette ${formatDuration(t)} ad arrivare.`;
  }
  if (i === 7) {
    return `Il Sole è quasi un punto: la sua luce ci mette più di ${Math.floor(t / 3600)} ore ad arrivare.`;
  }
  if (ratio >= 1) {
    return `Il Sole è ${fmt(ratio, 1)} volte più grande che da noi e manda ${fmt(light, 1)} volte più luce.`;
  }
  return `Il Sole appare ${fmt(1 / ratio, 1)} volte più piccolo che da noi e manda solo ${fmtLight(light)} volte la luce che riceviamo.`;
}

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 items-center gap-3 rounded-btn text-left text-sm disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        aria-hidden
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border border-border transition-colors",
          checked ? "bg-primary" : "bg-card",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-foreground transition-all motion-reduce:transition-none",
            checked ? "left-[1.35rem]" : "left-0.5",
          )}
        />
      </span>
      {label}
    </button>
  );
}

function Seg<T extends string>({
  value,
  options,
  onChange,
  label,
  disabled,
}: {
  value: T | null;
  options: { v: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-btn border border-border bg-card/70 p-1">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          disabled={disabled}
          aria-pressed={value === o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "min-h-11 rounded-btn px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            value === o.v ? "bg-primary text-primary-foreground" : "hover:bg-primary/10",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SunFromPlanets() {
  const [selected, setSelected] = useState<number | null>(2);
  const [point, setPoint] = useState<Point | null>("mean");
  const [d, setD] = useState(SUN_PLANETS[2].a);
  const [settled, setSettled] = useState(SUN_PLANETS[2].a);
  const [compare, setCompare] = useState(false);
  const [sky, setSky] = useState(false);
  const [time, setTime] = useState<"noon" | "sunset">("noon");
  const [moon, setMoon] = useState(false);
  const [moonOff, setMoonOff] = useState(0.3);
  const [width, setWidth] = useState(340);
  const [height, setHeight] = useState(255);
  const [reduced, setReduced] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const dRef = useRef(d);
  dRef.current = d;

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      setWidth(Math.max(200, Math.round(el.clientWidth)));
      setHeight(Math.max(150, Math.round(el.clientHeight)));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    const mqR = window.matchMedia("(prefers-reduced-motion: reduce)");
    const upd = () => {
      setReduced(mqR.matches);
    };
    upd();
    mqR.addEventListener("change", upd);
    return () => {
      ro.disconnect();
      mqR.removeEventListener("change", upd);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSettled(d), 500);
    return () => clearTimeout(t);
  }, [d]);

  const animateTo = useCallback(
    (target: number) => {
      cancelAnimationFrame(rafRef.current);
      if (reduced) {
        setD(target);
        return;
      }
      const from = dRef.current;
      const start = performance.now();
      const dur = 700;
      const step = (now: number) => {
        const k = Math.min(1, (now - start) / dur);
        const ease = 1 - Math.pow(1 - k, 3);
        const s = distanceToSlider(from) + (distanceToSlider(target) - distanceToSlider(from)) * ease;
        setD(k >= 1 ? target : sliderToDistance(s));
        if (k < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [reduced],
  );

  function choose(i: number) {
    setSelected(i);
    setPoint("mean");
    animateTo(SUN_PLANETS[i].a);
  }

  function choosePoint(p: Point) {
    if (selected === null) return;
    const pl = SUN_PLANETS[selected];
    setPoint(p);
    animateTo(p === "peri" ? perihelion(pl) : p === "aph" ? aphelion(pl) : pl.a);
  }

  const w = width;
  const h = height;
  const theta = angularDiameterDeg(d);
  const rawPx = (theta / FIELD_DEG) * w;
  const tiny = rawPx < 3;
  const px = tiny ? 2.5 : rawPx;
  const light = lightRatio(d);
  const glowO = Math.min(1, Math.max(0.35, 0.35 + (Math.log10(light) + 3.2) * 0.16));

  const skyEligible = selected === 1 || selected === 2 || selected === 3;
  const skyActive = sky && skyEligible;
  const hasTime = selected === 2 || selected === 3;
  const key: SkyKey = !skyActive
    ? "space"
    : selected === 1
      ? "venus"
      : selected === 2
        ? time === "noon"
          ? "earthDay"
          : "earthSunset"
        : time === "noon"
          ? "marsDay"
          : "marsSunset";
  const sunset = key === "earthSunset" || key === "marsSunset";
  const sunHidden = key === "venus";
  const cx = w / 2;
  const cy = sunset ? h * 0.66 : h / 2;
  const moonOn = key === "earthDay" && moon;
  const moonPx = (MOON_DIAMETER_DEG / FIELD_DEG) * w;
  const moonX = cx + (moonOff / FIELD_DEG) * w;
  const near = Math.abs(moonOff) <= 0.03;
  const corona = moonOn ? Math.max(0, 1 - Math.abs(moonOff) / 0.08) : 0;

  const sunStops: Record<SkyKey, [string, string, string]> = {
    space: ["#ffffff", "#fff6e0", "#ffd9a0"],
    venus: ["#ffffff", "#fff6e0", "#ffd9a0"],
    earthDay: ["#fffef5", "#fff6d0", "#ffe9a0"],
    earthSunset: ["#ffc489", "#ff9f55", "#ff8a3a"],
    marsDay: ["#fffdf0", "#fff4d2", "#ffe6a8"],
    marsSunset: ["#f4f8ff", "#d6e6ff", "#a9c6ee"],
  };
  const glowColor: Record<SkyKey, string> = {
    space: "255,246,224",
    venus: "255,246,224",
    earthDay: "255,240,190",
    earthSunset: "255,138,58",
    marsDay: "255,236,190",
    marsSunset: "111,159,216",
  };
  const stops = sunStops[key];
  const gc = glowColor[key];

  const label = `Il Sole visto da ${selected === null ? `una distanza libera di ${fmt(d, 2)} UA` : SUN_PLANETS[selected].name}: diametro apparente ${fmt(theta, 3)} gradi, ${fmt(theta * 60, 2)} primi d'arco, in una finestra di ${FIELD_DEG} gradi.`;


  const liveText = (() => {
    const th = angularDiameterDeg(settled);
    return `${selected === null ? "Distanza libera" : SUN_PLANETS[selected].name}: ${fmt(settled, 2)} unità astronomiche, Sole di ${fmt(th * 60, 2)} primi d'arco, luce ${fmtLight(lightRatio(settled))} volte quella terrestre.`;
  })();

  const note =
    selected === 0
      ? "Non ha atmosfera, quindi il cielo resta nero anche di giorno."
      : selected !== null && selected >= 4
        ? "Vista dallo spazio: questi pianeti non hanno una superficie solida."
        : null;

  const layer = "transition-opacity duration-[400ms] motion-reduce:transition-none";
  const hillsPath = `M0 ${h} L0 ${h * 0.8} Q${w * 0.2} ${h * 0.7} ${w * 0.38} ${h * 0.78} T${w * 0.7} ${h * 0.76} T${w} ${h * 0.79} L${w} ${h} Z`;
  const rocksPath = `M0 ${h} L0 ${h * 0.84} L${w * 0.1} ${h * 0.8} L${w * 0.18} ${h * 0.84} L${w * 0.3} ${h * 0.79} L${w * 0.45} ${h * 0.85} L${w * 0.6} ${h * 0.8} L${w * 0.75} ${h * 0.86} L${w * 0.88} ${h * 0.81} L${w} ${h * 0.85} L${w} ${h} Z`;

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">Il Sole visto da ogni pianeta</h2>
        <p className="text-sm text-muted-foreground">
          Keplero mise il Sole in un fuoco di ogni orbita: per questo la sua grandezza cambia lungo il giro.
        </p>
      </div>

      <div
        role="group"
        aria-label="Scegli un pianeta"
        className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
      >
        {SUN_PLANETS.map((p, i) => (
          <button
            key={p.name}
            type="button"
            onClick={() => choose(i)}
            aria-pressed={selected === i}
            className={cn(
              "flex min-h-11 min-w-16 shrink-0 flex-col items-center gap-1.5 rounded-card px-2 py-2 text-xs transition-colors",
              selected === i ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-primary/10",
            )}
          >
            <span className="relative flex size-11 items-center justify-center">
              <span className="block size-10 rounded-full" style={sphereStyle(i)} />
              {PLANET_LOOK[i].ring && (
                <span
                  aria-hidden
                  className="absolute left-1/2 top-1/2 h-3.5 w-[3.4rem] -translate-x-1/2 -translate-y-1/2 -rotate-[18deg] rounded-full border-[3px] border-[#e6d3a3]/90"
                  style={{ clipPath: "none" }}
                />
              )}
            </span>
            <span className={cn(selected === i ? "font-semibold text-primary" : "text-muted-foreground")}>{p.name}</span>
          </button>
        ))}
      </div>

      <div className="relative mx-auto aspect-[100/64.75] w-full max-w-xl overflow-hidden rounded-card bg-[#8d8572]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 [clip-path:polygon(0_0,100%_0,91%_7.7%,9%_7.7%)] bg-gradient-to-b from-[#5b5547] to-[#b9b19b]" />
        <div className="absolute inset-0 [clip-path:polygon(0_0,9%_7.7%,9%_86.9%,0_100%)] bg-gradient-to-r from-[#7a7362] to-[#b3ab96]" />
        <div className="absolute inset-0 [clip-path:polygon(100%_0,91%_7.7%,91%_86.9%,100%_100%)] bg-gradient-to-l from-[#5e5849] to-[#9a927e]" />
        <div className="absolute inset-0 [clip-path:polygon(0_100%,100%_100%,91%_86.9%,9%_86.9%)] bg-gradient-to-t from-[#e8e3d3] to-[#cfc8b4]" />
      </div>
      <div ref={boxRef} className="absolute inset-x-[9%] bottom-[13.1%] top-[7.7%] overflow-hidden">
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="block">
          <defs>
            <linearGradient id="sfp-space" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#02061a" />
              <stop offset="1" stopColor="#081346" />
            </linearGradient>
            <linearGradient id="sfp-venus" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c98a3a" />
              <stop offset="1" stopColor="#8a5a22" />
            </linearGradient>
            <linearGradient id="sfp-earthDay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1c4f9c" />
              <stop offset="1" stopColor="#bcd9f5" />
            </linearGradient>
            <linearGradient id="sfp-earthSunset" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1d3566" />
              <stop offset="0.45" stopColor="#8a5a8c" />
              <stop offset="0.75" stopColor="#e0795a" />
              <stop offset="1" stopColor="#ffab5c" />
            </linearGradient>
            <linearGradient id="sfp-marsDay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9c6f52" />
              <stop offset="1" stopColor="#c8a07a" />
            </linearGradient>
            <linearGradient id="sfp-marsSunset" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3b2620" />
              <stop offset="0.6" stopColor="#7a4636" />
              <stop offset="1" stopColor="#a8664a" />
            </linearGradient>
            <radialGradient id="sfp-sun">
              <stop offset="0" stopColor={stops[0]} />
              <stop offset="0.62" stopColor={stops[1]} />
              <stop offset="1" stopColor={stops[2]} />
            </radialGradient>
            <radialGradient id="sfp-glow">
              <stop offset="0" stopColor={`rgb(${gc})`} stopOpacity="0.9" />
              <stop offset="0.25" stopColor={`rgb(${gc})`} stopOpacity="0.35" />
              <stop offset="1" stopColor={`rgb(${gc})`} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sfp-corona">
              <stop offset="0.3" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="0.55" stopColor="#dfe8f5" stopOpacity="0.5" />
              <stop offset="1" stopColor="#c8d4e8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {(["space", "venus", "earthDay", "earthSunset", "marsDay", "marsSunset"] as SkyKey[]).map((k) => (
            <rect key={k} width={w} height={h} fill={`url(#sfp-${k})`} opacity={key === k ? 1 : 0} className={layer} />
          ))}

          <g opacity={key === "space" ? 1 : 0} className={layer}>
            {STARS.map((s, i) => (
              <circle
                key={i}
                cx={s.x * w}
                cy={s.y * h}
                r={s.r}
                fill="#ffffff"
                opacity={s.o}
                className={s.tw ? "space-fx [animation:space-twinkle_5s_ease-in-out_infinite]" : undefined}
              />
            ))}
          </g>

          {sunset && (
            <path
              d={key === "earthSunset" ? hillsPath : rocksPath}
              fill={key === "earthSunset" ? "#07101f" : "#1a0f0c"}
            />
          )}

          {!sunHidden && (
            <g key={key} className="animate-in fade-in duration-[400ms] motion-reduce:animate-none">
              {key === "marsSunset" && (
                <circle cx={cx} cy={cy} r={Math.max(px * 3, 40)} fill="#6f9fd8" opacity="0.35" />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={Math.max(px * 1.8, 22) * (1 + corona * 0.4)}
                fill="url(#sfp-glow)"
                opacity={key === "space" ? glowO : 0.8}
              />
              <circle
                cx={cx}
                cy={cy}
                r={px / 2}
                fill="url(#sfp-sun)"
                stroke="#fff6e0"
                strokeOpacity="0.85"
                strokeWidth="0.6"
              />
              {compare && (
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={(EARTH_DIAMETER_DEG / FIELD_DEG) * w * 0.5}
                    fill="none"
                    stroke="#ffffff"
                    strokeOpacity="0.8"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={cx}
                    y={cy + (EARTH_DIAMETER_DEG / FIELD_DEG) * w * 0.5 + 14}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#ffffff"
                    fillOpacity="0.85"
                  >
                    Sole a 1 UA (Terra)
                  </text>
                </g>
              )}
              {tiny && key === "space" && (
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r="16"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="animate-pulse motion-reduce:animate-none"
                  />
                  <text x={cx} y={cy + 34} textAnchor="middle" fontSize="12" fill="#ffffff">
                    Il Sole è qui
                  </text>
                  <g>
                    <circle cx={w - 44} cy={44} r="34" fill="#02061a" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1.2" />
                    <circle cx={w - 44} cy={44} r={Math.min(30, (rawPx * 10) / 2)} fill="url(#sfp-sun)" />
                    <text x={w - 44} y={92} textAnchor="middle" fontSize="11" fill="#ffffff">
                      lente 10x
                    </text>
                  </g>
                </g>
              )}
            </g>
          )}

          {moonOn && (
            <g>
              <circle cx={cx} cy={cy} r={Math.max(px * 2.2, 30)} fill="url(#sfp-corona)" opacity={corona} />
              <circle cx={moonX} cy={cy} r={moonPx / 2} fill="#0a0c14" />
            </g>
          )}

          {key === "venus" && (
            <text x={w / 2} y={h / 2} textAnchor="middle" fontSize={Math.max(14, w / 24)} fill="#fff6e0" fillOpacity="0.9">
              Da Venere il Sole non si vede
            </text>
          )}
        </svg>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.06)_16%,transparent_17%,transparent_36%,rgba(255,255,255,0.1)_37%,rgba(255,255,255,0.03)_44%,transparent_45%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(255,255,255,0.18),transparent_55%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 shadow-[inset_0_0_22px_rgba(0,0,0,0.4)]" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-[8.4%] bottom-[12.4%] top-[7.1%] border-[5px] border-[#ece8dc] shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-[5%] top-[86.9%] h-[5.5%] rounded-sm bg-gradient-to-b from-[#fbf8ee] via-[#ddd7c6] to-[#a39b86] shadow-[0_10px_16px_-4px_rgba(0,0,0,0.6)]" />
    </div>

      <div className="sr-only" aria-live="polite">
        {liveText}
      </div>

      {key === "venus" && (
        <p className="text-sm text-muted-foreground">
          Le nubi spesse di acido solforico coprono tutto il cielo: il Sole, anche di giorno, resta nascosto.
        </p>
      )}
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
      {moonOn && (
        <p className="rounded-card border border-border bg-card/70 p-3 text-sm" role="status">
          {near
            ? "Sulla Terra Sole e Luna appaiono quasi della stessa grandezza: per questo ci sono le eclissi totali."
            : "Avvicina la Luna al centro del Sole con il cursore."}
        </p>
      )}

      {selected !== null && <p className="text-sm">{caption(selected)}</p>}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <label htmlFor="sfp-dist" className="font-medium">
            Distanza dal Sole
          </label>
          {selected === null ? (
            <span className="rounded-badge border border-primary/50 bg-primary/10 px-2 py-0.5 text-xs text-primary">
              Distanza libera
            </span>
          ) : null}
          <span className="font-mono text-primary">{fmt(d, 2)} UA</span>
        </div>
        <input
          id="sfp-dist"
          type="range"
          min={0}
          max={1}
          step={0.002}
          value={distanceToSlider(d)}
          onChange={(e) => {
            cancelAnimationFrame(rafRef.current);
            setSelected(null);
            setPoint(null);
            setD(sliderToDistance(Number(e.target.value)));
          }}
          aria-valuetext={`${fmt(d, 2)} unità astronomiche`}
          className="h-11 w-full accent-primary"
        />
        <div className="flex justify-between font-mono text-xs text-muted-foreground">
          <span>0,3 UA</span>
          <span>scala logaritmica</span>
          <span>31 UA</span>
        </div>

        <Seg<Point>
          label="Punto dell'orbita"
          value={point}
          disabled={selected === null}
          onChange={choosePoint}
          options={[
            { v: "peri", label: "Perielio" },
            { v: "mean", label: "Media" },
            { v: "aph", label: "Afelio" },
          ]}
        />
        {selected === null && (
          <p className="text-xs text-muted-foreground">Scegli un pianeta per usare perielio, media e afelio.</p>
        )}

        <div className="flex flex-wrap gap-x-6">
          <Toggle checked={compare} onChange={setCompare} label="Confronta con la Terra" />
          <Toggle checked={sky} onChange={setSky} disabled={!skyEligible} label="Cielo del pianeta" />
        </div>
        {!skyEligible && (
          <p className="text-xs text-muted-foreground">Il cielo del pianeta è disponibile per Venere, Terra e Marte.</p>
        )}
        {skyActive && hasTime && (
          <Seg<"noon" | "sunset">
            label="Momento del giorno"
            value={time}
            onChange={setTime}
            options={[
              { v: "noon", label: "Mezzogiorno" },
              { v: "sunset", label: "Tramonto" },
            ]}
          />
        )}
        {key === "earthDay" && (
          <div className="space-y-2">
            <Toggle checked={moon} onChange={setMoon} label="Metti la Luna" />
            {moon && (
              <div className="space-y-1">
                <label htmlFor="sfp-moon" className="text-sm">
                  Posizione della Luna
                </label>
                <input
                  id="sfp-moon"
                  type="range"
                  min={-0.6}
                  max={0.6}
                  step={0.005}
                  value={moonOff}
                  onChange={(e) => setMoonOff(Number(e.target.value))}
                  aria-valuetext={`${fmt(moonOff, 3)} gradi dal centro del Sole`}
                  className="h-11 w-full accent-primary"
                />
              </div>
            )}
          </div>
        )}
      </div>


      <p className="text-sm text-muted-foreground">
        Il Sole si rimpicciolisce con la distanza, la sua luce molto di più, perché diminuisce con il quadrato.
      </p>
    </section>
  );
}
