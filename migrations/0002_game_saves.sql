-- Per-user QuestForge hall. user_id is TEXT (Better Auth ids / preview 'dev-user').
create table if not exists game_saves (
  user_id    text primary key,
  save       jsonb not null,
  updated_at timestamptz not null default now()
);
