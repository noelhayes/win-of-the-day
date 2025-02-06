-- Enable necessary extensions
create extension if not exists pgcrypto;

-- Create tables if they don't exist
create table if not exists public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    name text,
    email text,
    password_hash text,
    profile_image text,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    updated_at timestamp with time zone default timezone('utc', now()) not null
);

create table if not exists public.posts (
    id uuid default gen_random_uuid() primary key,
    content text not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    updated_at timestamp with time zone default timezone('utc', now()) not null
);

create table if not exists public.likes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    post_id uuid references public.posts(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    unique(user_id, post_id)
);

create table if not exists public.follows (
    id uuid default gen_random_uuid() primary key,
    follower_id uuid references public.profiles(id) on delete cascade not null,
    following_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    unique(follower_id, following_id)
);

create table if not exists public.friendships (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    friend_id uuid references public.profiles(id) on delete cascade not null,
    status text check (status in ('pending', 'accepted', 'rejected')) not null default 'pending',
    created_at timestamp with time zone default timezone('utc', now()) not null,
    updated_at timestamp with time zone default timezone('utc', now()) not null,
    unique(user_id, friend_id)
);

create table if not exists public.win_categories (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    color text not null,
    icon text not null,
    created_at timestamp with time zone default timezone('utc', now()) not null
);

create table if not exists public.post_categories (
    post_id uuid references public.posts(id) on delete cascade,
    category_id uuid references public.win_categories(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    primary key (post_id, category_id)
);

create table if not exists public.habits (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    name text not null,
    description text,
    frequency text not null,
    category_id uuid references public.win_categories(id),
    created_at timestamp with time zone default timezone('utc', now()) not null,
    updated_at timestamp with time zone default timezone('utc', now()) not null
);

create table if not exists public.habit_completions (
    id uuid default gen_random_uuid() primary key,
    habit_id uuid references public.habits(id) on delete cascade not null,
    completed_at timestamp with time zone default timezone('utc', now()) not null,
    created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Create or replace the handle_new_user function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
    display_name text;
begin
    if new.identities is not null and array_length(new.identities, 1) > 0 then
        display_name := new.identities[1]->'identity_data'->>'full_name';
    else
        display_name := new.raw_user_meta_data->>'name';
    end if;

    insert into public.profiles (id, name, email, password_hash)
    values (
        new.id,
        coalesce(display_name, split_part(new.email, '@', 1)),
        new.email,
        new.encrypted_password
    );
    return new;
end;
$$;

-- Create the auth trigger if it doesn't exist
do $$
begin
    if not exists (
        select 1
        from pg_trigger
        where tgname = 'on_auth_user_created'
    ) then
        create trigger on_auth_user_created
            after insert on auth.users
            for each row execute procedure public.handle_new_user();
    end if;
end
$$;
