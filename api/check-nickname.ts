import { z } from "zod";
import { getSql } from "./_lib/db.js";
import type { Req, Res } from "./_lib/http.js";
import { isOffensive, nicknameKey } from "../src/data/nickname.js";

const schema = z.object({ nickname: z.string().trim().min(1).max(20) });

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input" });
  }
  const { nickname } = parsed.data;
  if (isOffensive(nickname)) {
    return res.status(200).json({ available: false });
  }
  try {
    const sql = await getSql();
    const rows = await sql`
      SELECT 1 FROM quiz_scores WHERE nickname_key = ${nicknameKey(nickname)} LIMIT 1`;
    return res.status(200).json({ available: rows.length === 0 });
  } catch (err) {
    console.error("check-nickname error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}
