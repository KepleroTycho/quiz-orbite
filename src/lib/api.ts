export type Entry = { id: number; nickname: string; score: number; points: number; seconds: number };
export type SubmitResult = { id: number; score: number; points: number; rank: number; total: number };

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Se il server non risponde la classifica resta vuota, ma la pagina funziona. */
export async function getLeaderboard(): Promise<Entry[]> {
  try {
    const res = await fetch("/api/leaderboard");
    if (!res.ok) return [];
    return (await res.json()) as Entry[];
  } catch {
    return [];
  }
}

export function checkNickname(nickname: string) {
  return post<{ available: boolean }>("/api/check-nickname", { nickname });
}

export function submitScore(data: { nickname: string; seconds: number; answers: number[]; times: number[] }) {
  return post<SubmitResult>("/api/submit-score", data);
}
