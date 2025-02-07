-- Migration: Add reactions to posts
-- Description: Allow users to react to posts with emojis
-- up.sql

-- Create reactions table
create table if not exists public.reactions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    post_id uuid references public.posts(id) on delete cascade not null,
    emoji text not null,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    unique(user_id, post_id, emoji)
);

-- Create index for better performance
create index if not exists idx_reactions_post_id on public.reactions(post_id);

-- Enable RLS
alter table public.reactions enable row level security;

-- Set up RLS policies
create policy "Reactions are viewable by everyone"
    on reactions for select
    using (true);

create policy "Users can react to posts"
    on reactions for insert
    with check (auth.uid() = user_id);

create policy "Users can remove their reactions"
    on reactions for delete
    using (auth.uid() = user_id);

-- down.sql
/*
drop policy if exists "Users can remove their reactions" on public.reactions;
drop policy if exists "Users can react to posts" on public.reactions;
drop policy if exists "Reactions are viewable by everyone" on public.reactions;
drop index if exists idx_reactions_post_id;
drop table if exists public.reactions;
*/
