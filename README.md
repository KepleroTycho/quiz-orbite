# Quiz su Keplero e Tycho Brahe

Quiz a 15 domande con cronometro, punteggio e classifica pubblica.

- **Sito:** Vite + React + TypeScript + Tailwind CSS v4
- **Server:** funzioni Vercel nella cartella `api/` (classifica, controllo nickname, salvataggio punteggio)
- **Database:** Postgres su Neon

## Pubblicare su Vercel

1. Carica il contenuto di questa cartella in un repository GitHub (i file devono stare
   nella radice del repository, accanto a `package.json`).
2. Su <https://vercel.com/new> importa il repository. Il framework rilevato deve essere **Vite**.
   Premi **Deploy**.
3. **Collega il database** (serve per la classifica):
   - nel progetto su Vercel apri la scheda **Storage** (o **Marketplace**),
   - scegli **Neon** (Postgres), crea un database gratuito e collegalo al progetto:
     Vercel aggiunge da solo la variabile `DATABASE_URL`.
4. Fai un nuovo deploy (**Deployments → ⋯ → Redeploy**) perché la variabile venga letta.

La tabella `quiz_scores` viene creata automaticamente la prima volta che il sito usa il database.

## Controllare che il database funzioni

Apri `https://IL-TUO-SITO.vercel.app/api/leaderboard`:

| Cosa vedi | Significato |
| --- | --- |
| `[]` oppure un elenco | tutto a posto |
| `{"error":"server_error"}` | database non collegato o `DATABASE_URL` mancante: rivedi il punto 3 e rifai il deploy |
| errore 404 | la cartella `api` non è stata caricata su GitHub |

## Variabili d'ambiente

| Nome | Dove | Descrizione |
| --- | --- | --- |
| `DATABASE_URL` | Vercel (aggiunta da Neon) | Stringa di connessione a Postgres. Non va mai messa su GitHub. |

## Provarlo in locale (facoltativo)

`npm run dev` avvia solo il sito, senza le funzioni `api/`. Per provare tutto insieme:

```bash
npm install
npx vercel dev
```

## Azzerare la classifica

Dal pannello Neon (SQL Editor):

```sql
TRUNCATE quiz_scores RESTART IDENTITY;
```

## Struttura

```
index.html       pagina di ingresso
src/             il sito (App.tsx = quiz, data/ = domande e filtro nickname)
api/             funzioni server per Vercel
  _lib/          collegamento al database
```
