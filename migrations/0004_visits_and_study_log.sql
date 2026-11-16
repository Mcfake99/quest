-- Visit tracking + per-session study log for the admin dashboard.

-- One row per user: when they were first / last seen in the app (any signed-in
-- page load, refreshed by a heartbeat while the app is open).
create table if not exists user_presence (
  user_id    text primary key,
  first_seen timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);

-- Backfill from what we already know: activity events and Better Auth sessions
-- (Better Auth bumps session."updatedAt" when it refreshes a long-lived session).
insert into user_presence (user_id, first_seen, last_seen)
select user_id, min(t), max(t) from (
  select user_id, created_at as t from activity_events
  union all
  select "userId", "createdAt" from "session"
  union all
  select "userId", "updatedAt" from "session"
) x
group by user_id
on conflict (user_id) do nothing;

-- Backfill one 'visit' per session refresh day that has no other event that day,
-- so already-signed-in students have some history before the new tracking.
insert into activity_events (user_id, type, created_at)
select s."userId", 'visit', s."updatedAt" from "session" s
where s."updatedAt" > s."createdAt" + interval '30 minutes'
  and not exists (
    select 1 from activity_events e
    where e.user_id = s."userId" and e.created_at::date = s."updatedAt"::date
  );

-- Each study session: a mock sitting, quiz / Daily Mix run, flashcard run, etc.
-- client_id is minted on the device so retries and progressive updates upsert.
create table if not exists study_sessions (
  id          bigserial primary key,
  user_id     text not null,
  client_id   text not null,
  kind        text not null,            -- 'mock' | 'quiz' | 'paper-quiz' | 'mistakes' | 'flashcards' | 'revision'
  mode        text,                     -- quiz kind (mix, sprint, spotlight, target, subject, review, figures)
  subject_id  text,
  ref         text,                     -- paper id for mocks
  title       text,
  status      text not null,            -- 'in_progress' | 'marking' | 'completed' | 'abandoned'
  ended_by    text,                     -- mocks: 'time' | 'candidate'
  started_at  timestamptz not null,
  ended_at    timestamptz,
  score       real,
  max_score   real,
  items       jsonb not null default '[]'::jsonb, -- [[itemId, got, of], …]
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, client_id)
);
create index if not exists study_sessions_user_idx on study_sessions (user_id, started_at desc);
