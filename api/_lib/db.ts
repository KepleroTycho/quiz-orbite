import { neon } from "@neondatabase/serverless";

// Database Postgres (Neon). Su Vercel la variabile DATABASE_URL viene aggiunta
// automaticamente quando colleghi Neon al progetto (vedi README).

function createClient(url: string) {
  return neon(url);
}

let client: ReturnType<typeof createClient> | null = null;
let ready: Promise<void> | null = null;

function connect() {
  if (client) return client;
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) {
    throw new Error("DATABASE_URL non impostata: collega un database Postgres al progetto (vedi README).");
  }
  client = createClient(url);
  return client;
}

/** Restituisce il client SQL, creando la tabella della classifica alla prima chiamata. */
export async function getSql() {
  const sql = connect();
  if (!ready) {
    ready = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS quiz_scores (
          id SERIAL PRIMARY KEY,
          nickname TEXT NOT NULL,
          nickname_key TEXT NOT NULL UNIQUE,
          score INTEGER NOT NULL,
          points INTEGER NOT NULL,
          seconds DOUBLE PRECISION NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
      await sql`
        CREATE INDEX IF NOT EXISTS quiz_scores_rank_idx
        ON quiz_scores (points DESC, seconds ASC, id ASC)`;
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  await ready;
  return sql;
}
