-----------------------------------------------
-- 0. CLEAN UP: DROP OLD TRIGGERS, FUNCTIONS & TABLES
-----------------------------------------------

-- Drop trigger and function for new user creation (if they exist)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Drop the tables in the correct dependency order
drop table if exists public.likes cascade;
drop table if exists public.follows cascade;
drop table if exists public.posts cascade;
drop table if exists public.profiles cascade;

-----------------------------------------------
-- 1. ENABLE EXTENSION
-----------------------------------------------

create extension if not exists pgcrypto;

-----------------------------------------------
-- 2. PROFILES TABLE & USER CREATION TRIGGER
-----------------------------------------------

-- Create profiles table with UUID id (referencing auth.users)
create table public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    name text,
    email text,
    password_hash text,
    profile_image text,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    updated_at timestamp with time zone default timezone('utc', now()) not null
);

-- Enable Row Level Security on profiles
alter table public.profiles enable row level security;

-- Create policies on profiles
drop policy if exists "Anyone can view profiles" on public.profiles;
create policy "Anyone can view profiles"
    on public.profiles for select
    using (true);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
    on public.profiles for insert
    to authenticated
    with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
    on public.profiles for delete
    using (auth.uid() = id);

-- Create function to auto-create a profile when a new user is added
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
    display_name text;
begin
    -- For Google login, get name from identities
    IF new.identities IS NOT NULL AND array_length(new.identities, 1) > 0 THEN
        display_name := new.identities[1]->'identity_data'->>'full_name';
    ELSE
        -- For regular signup, get name from raw_user_meta_data
        display_name := new.raw_user_meta_data->>'name';
    END IF;

    insert into public.profiles (id, name, email, password_hash)
    values (
        new.id,
        COALESCE(display_name, split_part(new.email, '@', 1)),  -- fallback to email username if no name
        new.email,
        new.encrypted_password  -- Supabase stores the hashed password here
    );
    return new;
end;
$$;

-- Create trigger on auth.users to invoke profile creation
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-----------------------------------------------
-- 3. POSTS TABLE & UPDATED_AT TRIGGER
-----------------------------------------------

-- Create posts table with UUID id
create table public.posts (
    id uuid default gen_random_uuid() primary key,
    content text not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    updated_at timestamp with time zone default timezone('utc', now()) not null
);

-- Enable Row Level Security on posts
alter table public.posts enable row level security;

-- Create policies on posts
drop policy if exists "Anyone can view posts" on public.posts;
create policy "Anyone can view posts"
    on public.posts for select
    using (true);

drop policy if exists "Users can create their own posts" on public.posts;
create policy "Users can create their own posts"
    on public.posts for insert
    to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "Users can update their own posts" on public.posts;
create policy "Users can update their own posts"
    on public.posts for update
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "Users can delete their own posts" on public.posts;
create policy "Users can delete their own posts"
    on public.posts for delete
    to authenticated
    using (auth.uid() = user_id);

-- Create function to auto-update the updated_at field
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

-- Create trigger to invoke the update function on posts
create trigger update_posts_updated_at
before update on public.posts
for each row execute procedure public.update_updated_at();

-----------------------------------------------
-- 4. LIKES TABLE & POLICIES
-----------------------------------------------

-- Create likes table with UUID id; note that post_id now references posts.id (UUID)
create table public.likes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    post_id uuid references public.posts(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    unique(user_id, post_id)
);

-- Enable Row Level Security on likes
alter table public.likes enable row level security;

-- Create policies on likes
drop policy if exists "Anyone can view likes" on public.likes;
create policy "Anyone can view likes"
    on public.likes for select
    using (true);

drop policy if exists "Users can create likes" on public.likes;
create policy "Users can create likes"
    on public.likes for insert
    to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own likes" on public.likes;
create policy "Users can delete their own likes"
    on public.likes for delete
    to authenticated
    using (auth.uid() = user_id);

-----------------------------------------------
-- 5. FOLLOWS TABLE & POLICIES
-----------------------------------------------

-- Create follows table with UUID id
create table public.follows (
    id uuid default gen_random_uuid() primary key,
    follower_id uuid references public.profiles(id) on delete cascade not null,
    following_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    unique(follower_id, following_id)
);

-- Enable Row Level Security on follows
alter table public.follows enable row level security;

-- Create policies on follows
create policy "Users can view all follows"
    on public.follows for select
    to authenticated
    using (true);

create policy "Users can create follows"
    on public.follows for insert
    to authenticated
    with check (auth.uid() = follower_id);

create policy "Users can delete their own follows"
    on public.follows for delete
    to authenticated
    using (auth.uid() = follower_id);
