import { useEffect, useRef, useState } from "react";
import { Timer, Trophy, Check, X, BookOpen, Telescope } from "lucide-react";
import { questions, pointsFor } from "./data/questions";
import { getLeaderboard, submitScore, checkNickname, type Entry } from "./lib/api";
import { cn } from "./lib/cn";
import Laboratory from "./Laboratory";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r.toFixed(1).padStart(4, "0")}`;
}

type Phase = "start" | "play" | "end";

export default function App() {
  const [view, setView] = useState<"home" | "quiz" | "lab">("home");
  const [board, setBoard] = useState<Entry[]>([]);
  const [boardReady, setBoardReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("start");
  const [nick, setNick] = useState("");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<{ id: number; score: number; points: number; rank: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const startRef = useRef(0);
  const qStartRef = useRef(0);
  const [times, setTimes] = useState<number[]>([]);
  const [gained, setGained] = useState(0);
  const [points, setPoints] = useState(0);

  async function refreshBoard() {
    setBoard(await getLeaderboard());
    setBoardReady(true);
  }

  useEffect(() => {
    void refreshBoard();
  }, []);

  useEffect(() => {
    if (phase !== "play") return;
    const t = setInterval(() => setElapsed((Date.now() - startRef.current) / 1000), 100);
    return () => clearInterval(t);
  }, [phase]);

  const [checking, setChecking] = useState(false);

  async function start() {
    if (!nick.trim()) {
      setError("Scegli un nickname per iniziare.");
      return;
    }
    setChecking(true);
    setError("");
    try {
      const r = await checkNickname(nick.trim());
      if (!r.available) {
        setError("Nickname non disponibile: scegline un altro.");
        setChecking(false);
        return;
      }
    } catch {
      setError("Non riusciamo a verificare il nickname, riprova.");
      setChecking(false);
      return;
    }
    setChecking(false);
    begin();
  }

  function begin() {
    setIdx(0);
    setAnswers([]);
    setTimes([]);
    setGained(0);
    setPoints(0);
    setPicked(null);
    setResult(null);
    setElapsed(0);
    startRef.current = Date.now();
    qStartRef.current = Date.now();
    setPhase("play");
  }

  async function finish(all: number[], allTimes: number[]) {
    const seconds = (Date.now() - startRef.current) / 1000;
    setElapsed(seconds);
    setPhase("end");
    setSaving(true);
    setError("");
    try {
      const r = await submitScore({ nickname: nick.trim(), seconds, answers: all, times: allTimes });
      setResult(r);
      await refreshBoard();
    } catch {
      setError("Non siamo riusciti a salvare il risultato in classifica.");
    }
    setSaving(false);
  }

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const t = (Date.now() - qStartRef.current) / 1000;
    setTimes((prev) => [...prev, t]);
    setGained(pointsFor(i === questions[idx].answer, t));
  }

  function next() {
    if (picked === null) return;
    const all = [...answers, picked];
    setAnswers(all);
    setPicked(null);
    setPoints((p) => p + gained);
    setGained(0);
    qStartRef.current = Date.now();
    if (idx + 1 >= questions.length) void finish(all, times);
    else setIdx(idx + 1);
  }

  const q = questions[idx];
  const correct = answers.reduce((n, a, i) => n + (a === questions[i].answer ? 1 : 0), 0);

  return (
    <main className="relative min-h-screen overflow-clip bg-[linear-gradient(180deg,#02061a_0%,#081346_55%,#12246e_100%)] text-foreground">
      <style>{`
        @keyframes space-twinkle{0%,100%{opacity:.35}50%{opacity:.9}}
        @keyframes space-glow{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:.85;transform:scale(1.06)}}
        @keyframes space-drift{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @media (prefers-reduced-motion:reduce){.space-fx{animation:none!important}}
      `}</style>
      <div
        aria-hidden
        className="space-fx pointer-events-none absolute left-1/2 top-[-14rem] size-[48rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(110,168,255,0.28),transparent_65%)] blur-2xl [animation:space-glow_9s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="space-fx pointer-events-none absolute bottom-[-12rem] right-[-10rem] size-[36rem] rounded-full bg-[radial-gradient(circle,rgba(139,139,255,0.22),transparent_65%)] blur-3xl [animation:space-glow_12s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="space-fx pointer-events-none absolute inset-0 [animation:space-twinkle_6s_ease-in-out_infinite] [background-image:radial-gradient(1px_1px_at_60px_80px,#fff,transparent),radial-gradient(1px_1px_at_140px_20px,#bcd4ff,transparent)] [background-size:230px_170px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(1px_1px_at_20px_30px,var(--foreground),transparent),radial-gradient(1px_1px_at_90px_120px,var(--primary),transparent),radial-gradient(1.5px_1.5px_at_160px_60px,var(--foreground),transparent)] [background-size:200px_160px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-18rem] size-[44rem] -translate-x-1/2 rounded-full border border-primary/30"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-12rem] size-[32rem] -translate-x-1/2 rounded-full border border-primary/20"
      />

      {view === "lab" && <Laboratory onBack={() => setView("home")} />}
      {view === "home" && (
        <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
          <p className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-primary"><Telescope className="size-4" /> Uraniborg · Praga</p>
          <h1 className="font-display text-4xl font-bold sm:text-6xl">Keplero e Tycho Brahe</h1>
          <p className="mt-4 max-w-prose text-muted-foreground">Dalle osservazioni di Tycho Brahe alle leggi di Keplero: mettiti alla prova oppure esplora il Sistema solare.</p>
          <div className="mt-10 grid w-full max-w-xl gap-4 sm:grid-cols-2">
            <button onClick={() => setView("quiz")} className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-card border border-border bg-card/80 p-6 text-left transition hover:border-primary hover:bg-card">
              <Telescope className="size-9 text-primary" /><span className="font-display text-2xl font-semibold">Quiz</span><span className="text-sm text-muted-foreground">Verifica le tue conoscenze e scala la classifica.</span>
            </button>
            <button onClick={() => setView("lab")} className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-card border border-border bg-card/80 p-6 text-left transition hover:border-primary hover:bg-card">
              <BookOpen className="size-9 text-primary" /><span className="font-display text-2xl font-semibold">Laboratorio</span><span className="text-sm text-muted-foreground">Tre esperienze interattive di astronomia.</span>
            </button>
          </div>
        </div>
      )}
      {view === "quiz" && <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-6 text-center"><button onClick={() => setView("home")} className="min-h-11 rounded-btn border border-border bg-card/70 px-4 text-sm hover:border-primary">← Torna alla scelta</button></div>
        <header className="mb-10 text-center">
          <p className="mb-3 flex items-center justify-center gap-2 text-sm uppercase tracking-[0.25em] text-primary">
            <Telescope className="size-4" /> Uraniborg · Praga
          </p>
          <h1 className="font-display text-4xl font-bold sm:text-6xl">Keplero e Tycho Brahe</h1>
          <p className="mx-auto mt-4 max-w-prose text-muted-foreground">
            Quindici domande, dalle più facili alle più difficili. Il cronometro parte con la prima.
          </p>
        </header>

        {phase === "start" && (
          <section className="mx-auto max-w-md space-y-4">
            <label htmlFor="nick" className="block text-sm font-medium">Il tuo nickname</label>
            <input
              id="nick"
              value={nick}
              maxLength={20}
              onChange={(e) => {
                setNick(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && !checking && void start()}
              placeholder="Es. AstroMarco"
              className="h-12 w-full rounded-input border border-border bg-card px-4 text-foreground outline-none focus:border-primary"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              onClick={() => void start()}
              disabled={checking}
              className="h-12 w-full rounded-btn bg-primary px-6 font-semibold text-primary-foreground hover:opacity-90"
            >
              Inizia il quiz
            </button>
            <p className="text-center text-sm text-muted-foreground">Nessuna registrazione necessaria.</p>
          </section>
        )}

        {phase === "play" && (
          <section className="space-y-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Domanda {idx + 1} di {questions.length} · {nick}
                <span className="ml-3 font-mono text-foreground/80">{points} pts</span>
              </span>
              <span className="flex items-center gap-2 font-mono text-lg text-primary">
                <Timer className="size-5" /> {fmt(elapsed)}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-border">
              <div className="h-full bg-primary transition-all" style={{ width: `${(idx / questions.length) * 100}%` }} />
            </div>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">{q.q}</h2>
            <div className="grid gap-3">
              {q.options.map((o, i) => {
                const isAns = i === q.answer;
                const isPick = i === picked;
                return (
                  <button
                    key={o}
                    onClick={() => pick(i)}
                    disabled={picked !== null}
                    className={cn(
                      "flex min-h-14 items-center justify-between gap-3 rounded-card border border-border bg-card px-4 py-3 text-left transition-colors",
                      picked === null && "hover:border-primary",
                      picked !== null && isAns && "border-success",
                      picked !== null && isPick && !isAns && "border-destructive",
                    )}
                  >
                    <span>{o}</span>
                    {picked !== null && isAns && <Check className="size-5 shrink-0 text-success" />}
                    {picked !== null && isPick && !isAns && <X className="size-5 shrink-0 text-destructive" />}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {picked === q.answer ? (
                    <>
                      <strong className="text-foreground">Esatto!</strong>
                      <span className="ml-2 font-mono text-sm text-primary">+{gained} pts</span>
                    </>
                  ) : (
                    <>
                      <strong className="text-foreground">Non proprio. </strong>
                      {q.note}
                    </>
                  )}
                </p>
                <button
                  onClick={next}
                  className="h-12 w-full rounded-btn bg-primary px-6 font-semibold text-primary-foreground hover:opacity-90"
                >
                  {idx + 1 >= questions.length ? "Vedi il risultato" : "Prossima domanda"}
                </button>
              </div>
            )}
          </section>
        )}

        {phase === "end" && (
          <section className="space-y-6 text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-primary">Risultato di {nick}</p>
            <p className="font-display text-6xl font-bold">
              {correct}
              <span className="text-3xl text-muted-foreground"> / {questions.length}</span>
            </p>
            <p className="font-mono text-xl">
              <span className="text-primary">{result?.points ?? points} pts</span>
              <span className="mx-3 text-muted-foreground">·</span>
              Tempo {fmt(elapsed)}
            </p>
            {saving && <p className="text-muted-foreground">Salvo in classifica…</p>}
            {result && (
              <p className="text-muted-foreground">
                Sei al posto <strong className="text-foreground">{result.rank}</strong> su {result.total}.
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              onClick={begin}
              disabled={saving}
              className="h-12 rounded-btn bg-primary px-8 font-semibold text-primary-foreground hover:opacity-90"
            >
              Gioca ancora
            </button>
          </section>
        )}

        {phase !== "play" && (
        <section className="mt-16">
          <h2 className="mb-4 flex items-center justify-center gap-2 font-display text-2xl font-semibold">
            <Trophy className="size-6 text-primary" /> Classifica
          </h2>
          {!boardReady ? (
            <p className="rounded-card border border-border bg-card p-6 text-center text-muted-foreground">
              Carico la classifica…
            </p>
          ) : board.length === 0 ? (
            <p className="rounded-card border border-border bg-card p-6 text-center text-muted-foreground">
              Nessun risultato ancora: sii il primo.
            </p>
          ) : (
            <div className="overflow-hidden rounded-card border border-border bg-card/70 backdrop-blur-sm">
              <div className="grid grid-cols-[2rem_1fr_3.5rem_4rem] items-center gap-3 border-b border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground">
                <span>#</span>
                <span>Nickname</span>
                <span className="text-right">Corrette</span>
                <span className="text-right">Pts</span>
              </div>
              <ol className="divide-y divide-border">
                {board.map((e, i) => (
                  <li
                    key={e.id}
                    className={cn(
                      "grid grid-cols-[2rem_1fr_3.5rem_4rem] items-center gap-3 px-4 py-3 text-sm",
                      i === 0 && "bg-gradient-to-r from-primary/40 via-primary/20 to-transparent",
                      i === 1 && "bg-gradient-to-r from-primary/28 via-primary/12 to-transparent",
                      i === 2 && "bg-gradient-to-r from-primary/18 via-primary/8 to-transparent",
                      result?.id === e.id && "ring-1 ring-inset ring-primary/70 shadow-[inset_0_0_24px_rgba(124,184,255,0.18)]",
                    )}
                  >
                    <span
                      className={cn(
                        "font-mono",
                        i < 3 ? "font-semibold text-primary" : "text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 truncate font-medium">{e.nickname}</span>
                    <span className="text-right font-mono">{e.score}/{questions.length}</span>
                    <span className="text-right font-mono font-semibold text-primary">{e.points}</span>
                  </li>
                ))}
              </ol>
              {result && !board.some((e) => e.id === result.id) && (
                <div className="grid grid-cols-[2rem_1fr_3.5rem_4rem] items-center gap-3 border-t border-dashed border-border px-4 py-3 text-sm ring-1 ring-inset ring-primary/70 shadow-[inset_0_0_24px_rgba(124,184,255,0.18)]">
                  <span className="font-mono text-primary">{result.rank}</span>
                  <span className="min-w-0 truncate font-medium">{nick}</span>
                  <span className="text-right font-mono">{result.score}/{questions.length}</span>
                  <span className="text-right font-mono font-semibold text-primary">{result.points}</span>
                </div>
              )}
            </div>
          )}
        </section>
        )}
      </div>}
    </main>
  );
}
