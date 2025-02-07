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

-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
    display_name text;
begin
    if new.raw_user_meta_data->>'full_name' is not null then
        display_name := new.raw_user_meta_data->>'full_name';
    else
        display_name := split_part(new.email, '@', 1);
    end if;

    insert into public.profiles (id, name, email)
    values (
        new.id,
        display_name,
        new.email
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
