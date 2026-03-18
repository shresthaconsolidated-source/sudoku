-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users Table
create table if not exists users (
  id uuid references auth.users not null primary key,
  email text not null,
  first_name text,
  avatar_url text,
  total_completed integer default 0,
  total_started integer default 0,
  win_rate numeric default 0.0,
  mmr integer default 1000,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Puzzles Table
create type difficulty_level as enum ('Easy', 'Medium', 'Hard', 'Extreme', 'Insane');

create table if not exists puzzles (
  id serial primary key,
  difficulty difficulty_level not null,
  initial_grid jsonb not null,
  solution_grid jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Progress Table
create table if not exists user_progress (
  user_id uuid references public.users(id) not null,
  difficulty difficulty_level not null,
  last_completed_puzzle_id integer references public.puzzles(id),
  primary key (user_id, difficulty)
);

-- Rooms Table (Lobby & active games)
create type room_status as enum ('waiting', 'active', 'completed');

create table if not exists rooms (
  id varchar(6) primary key,
  host_id uuid references public.users(id) not null,
  joiner_id uuid references public.users(id),
  puzzle_id integer references public.puzzles(id),
  difficulty difficulty_level not null,
  status room_status default 'waiting' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Game State Table (Live sync)
create table if not exists game_state (
  room_id varchar(6) references public.rooms(id) primary key,
  current_grid jsonb not null, -- Stores user inputs + pencil notes + filled_by
  mistakes_count integer default 0,
  start_time timestamp with time zone,
  end_time timestamp with time zone
);

-- Leaderboard Table
create table if not exists leaderboard (
  id uuid default uuid_generate_v4() primary key,
  puzzle_id integer references public.puzzles(id) not null,
  player_names text[] not null,
  time_taken_seconds integer not null,
  mistakes integer default 0,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Realtime for Rooms and Game State
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table game_state;

-- RPC Functions for Metagame Progression
-- Use via supabase.rpc('increment_completed', { target_user_id: '...' })
CREATE OR REPLACE FUNCTION increment_completed(target_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET total_completed = total_completed + 1
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use via supabase.rpc('increment_started', { target_user_id: '...' })
CREATE OR REPLACE FUNCTION increment_started(target_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET total_started = total_started + 1
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use via supabase.rpc('increment_mmr', { target_user_id: '...', amount: 20 })
CREATE OR REPLACE FUNCTION increment_mmr(target_user_id uuid, amount int)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET mmr = mmr + amount
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
