import { getSql } from "./_lib/db.js";
import type { Req, Res } from "./_lib/http.js";

export default async function handler(req: Req, res: Res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  try {
    const sql = await getSql();
    const rows = await sql`
      SELECT id, nickname, score, points, seconds
      FROM quiz_scores
      ORDER BY points DESC, seconds ASC, id ASC
      LIMIT 20`;
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(
      rows.map((r) => ({
        id: Number(r.id),
        nickname: String(r.nickname),
        score: Number(r.score),
        points: Number(r.points),
        seconds: Number(r.seconds),
      })),
    );
  } catch (err) {
    console.error("leaderboard error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}
