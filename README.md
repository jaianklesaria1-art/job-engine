# Job Engine dashboard

Private dashboard for Jai's job search. The OpenMausBot bots write jobs, scores, contacts and replies to Supabase; this app shows them and sends requests back (tailor a CV, run a bot, approve a batch).

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase URL and anon key
npx vite --host 127.0.0.1 --port 5173
```

Open http://127.0.0.1:5173/?demo=1 to see it with fictional sample data.

## Deploy (Netlify)

Build settings come from `netlify.toml`. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in Netlify. Only the anon key goes here; database access is limited to the owner's login by row level security (`supabase/schema.sql`).

## Stack

Vite, React 19, TypeScript, Tailwind v4, shadcn (base-nova), Efferd dashboard shell, Kibo UI kanban, Supabase.
