import { z } from "zod";
import { getSql } from "./_lib/db.js";
import type { Req, Res } from "./_lib/http.js";
import { questions, pointsFor } from "../src/data/questions.js";
import { isOffensive, nicknameKey } from "../src/data/nickname.js";

const schema = z.object({
  nickname: z.string().trim().min(1).max(20),
  seconds: z.number().min(0).max(86400),
  answers: z.array(z.number().int()).length(questions.length),
  times: z.array(z.number().min(0).max(86400)).length(questions.length),
});

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input" });
  }
  const data = parsed.data;
  if (isOffensive(data.nickname)) {
    return res.status(400).json({ error: "nickname_not_allowed" });
  }

  // Il punteggio si calcola qui sul server, non ci si fida di quello del browser.
  const score = data.answers.reduce((n, a, i) => n + (a === questions[i].answer ? 1 : 0), 0);
  const points = data.answers.reduce(
    (n, a, i) => n + pointsFor(a === questions[i].answer, data.times[i]),
    0,
  );
  const seconds = Math.round(data.seconds * 10) / 10;
  const key = nicknameKey(data.nickname);

  try {
    const sql = await getSql();

    // Un solo risultato per nickname: se esiste già, viene aggiornato.
    const saved = await sql`
      INSERT INTO quiz_scores (nickname, nickname_key, score, points, seconds)
      VALUES (${data.nickname}, ${key}, ${score}, ${points}, ${seconds})
      ON CONFLICT (nickname_key) DO UPDATE
        SET score = EXCLUDED.score,
            points = EXCLUDED.points,
            seconds = EXCLUDED.seconds,
            created_at = now()
      RETURNING id`;

    const stats = await sql`
      SELECT
        (SELECT count(*)::int FROM quiz_scores
          WHERE points > ${points} OR (points = ${points} AND seconds < ${seconds})) AS better,
        (SELECT count(*)::int FROM quiz_scores) AS total`;

    return res.status(200).json({
      id: Number(saved[0].id),
      score,
      points,
      rank: Number(stats[0].better) + 1,
      total: Number(stats[0].total),
    });
  } catch (err) {
    console.error("submit-score error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}
