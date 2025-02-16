-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Create profiles table
create table if not exists public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    name text,
    email text unique,
    bio text check (char_length(bio) <= 1000),
    profile_image text,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    updated_at timestamp with time zone default timezone('utc', now()) not null
);

-- Add username column to profiles table
alter table public.profiles
  add column username text unique,
  add column username_updated_at timestamp with time zone,
  add constraint username_format check (
    username ~ '^[a-zA-Z0-9_]{3,20}$' and
    username !~ '^[0-9_]' -- Cannot start with number or underscore
  );

-- Create index for username lookups
create index if not exists profiles_username_idx on profiles (username);

-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  display_name text;
  temp_username text;
begin
  -- Use full_name from raw_user_meta_data if available, else fallback to the email prefix.
  if new.raw_user_meta_data->>'full_name' is not null then
    display_name := new.raw_user_meta_data->>'full_name';
  else
    display_name := split_part(new.email, '@', 1);
  end if;

  -- Start with the email prefix and remove any character that's not a letter or number.
  temp_username := regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9]', '', 'g');

  -- Fallback if cleaning produces an empty string.
  if temp_username = '' then
    temp_username := 'user';
  end if;

  -- Ensure the username starts with a letter.
  if temp_username !~ '^[A-Za-z]' then
    temp_username := 'user' || temp_username;
  end if;

  -- Ensure a minimum length of 3 characters by padding if needed.
  if char_length(temp_username) < 3 then
    temp_username := temp_username || repeat('x', 3 - char_length(temp_username));
  end if;

  -- Trim to a maximum of 20 characters.
  temp_username := left(temp_username, 20);

  -- Ensure uniqueness by appending a random 4-character string if necessary,
  -- while keeping the total length at most 20 characters.
  while exists (select 1 from profiles where username = temp_username) loop
    temp_username := left(temp_username, 16) || substring(md5(random()::text) from 1 for 4);
  end loop;

  insert into public.profiles (id, name, email, username)
  values (
    new.id,
    display_name,
    new.email,
    temp_username
  );
  return new;
end;
$$;

-- Create trigger for new user handling
create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Enable RLS
alter table public.profiles enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Profiles are viewable by everyone" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;

-- Set up RLS policies
create policy "Profiles are viewable by everyone"
    on profiles for select
    using (true);

create policy "Users can update own profile"
    on profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "Users can insert own profile"
    on profiles for insert
    with check (auth.uid() = id);

-- Create an index on email for faster searches
create index if not exists profiles_email_idx on profiles (email);

-- Enable the pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- Create indexes for faster text search
CREATE INDEX IF NOT EXISTS idx_profiles_username_search ON profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_name_search ON profiles USING gin (name gin_trgm_ops);

