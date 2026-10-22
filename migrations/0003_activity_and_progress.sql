-- Admin tracking: login/visit events + server copy of mock/flashcard/mistake progress.
create table if not exists activity_events (
  id         bigserial primary key,
  user_id    text not null,
  type       text not null, -- 'sign_in' | 'visit'
  created_at timestamptz not null default now()
);
create index if not exists activity_events_user_idx on activity_events (user_id, created_at desc);
create index if not exists activity_events_created_idx on activity_events (created_at);

-- Backfill: every existing Better Auth session was a sign-in.
insert into activity_events (user_id, type, created_at)
select "userId", 'sign_in', "createdAt" from "session";

-- Per-user copy of the browser's 'questforge-papers-v1' store (attempts, flash, mistakes).
create table if not exists papers_progress (
  user_id    text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
