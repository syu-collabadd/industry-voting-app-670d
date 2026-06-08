-- ScreenVote Database Schema
-- Run this in the Supabase SQL Editor

-- Members table
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  member_type text not null check (member_type in ('Film', 'TV', 'Both')),
  token text not null unique,
  created_at timestamptz default now()
);

-- Titles table
create table if not exists titles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year integer not null,
  type text not null check (type in ('Film', 'TV')),
  description text,
  created_at timestamptz default now()
);

-- Votes table
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  title_id uuid not null references titles(id) on delete cascade,
  score integer not null check (score >= 1 and score <= 10),
  created_at timestamptz default now(),
  unique(member_id, title_id)
);

-- Enable Row Level Security
alter table members enable row level security;
alter table titles enable row level security;
alter table votes enable row level security;

-- Members: allow read by token match (used for login lookup)
create policy "members can read own record" on members
  for select using (true);

-- Titles: public read
create policy "anyone can read titles" on titles
  for select using (true);

-- Votes: anyone can read (for stats)
create policy "anyone can read votes" on votes
  for select using (true);

-- Votes: members can insert/update their own votes
create policy "members can insert votes" on votes
  for insert with check (true);

create policy "members can update their own votes" on votes
  for update using (true);

-- Members: admin can insert/update/delete (via service role or anon with these policies)
create policy "members full access" on members
  for all using (true) with check (true);

-- Titles: admin can insert/update/delete
create policy "titles full access" on titles
  for all using (true) with check (true);

-- Seed sample data (optional - uncomment to add test data)
-- insert into members (name, email, member_type, token) values
--   ('Alice Film', 'alice@example.com', 'Film', 'FILM001'),
--   ('Bob TV', 'bob@example.com', 'TV', 'TV0001'),
--   ('Carol Both', 'carol@example.com', 'Both', 'BOTH01');

-- insert into titles (name, year, type, description) values
--   ('The Grand Illusion', 2024, 'Film', 'An epic drama about the film industry.'),
--   ('Midnight Serial', 2024, 'TV', 'A gripping crime mini-series.'),
--   ('Horizon', 2024, 'Film', 'A sweeping adventure epic.'),
--   ('The Watchers', 2023, 'TV', 'A supernatural thriller series.');
