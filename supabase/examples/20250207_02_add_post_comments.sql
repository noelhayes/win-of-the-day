-- Migration: Add comments to posts
-- Description: Allow users to comment on posts
-- up.sql

-- Create comments table
create table if not exists public.comments (
    id uuid default gen_random_uuid() primary key,
    post_id uuid references public.posts(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    content text not null check (char_length(content) <= 500),
    created_at timestamp with time zone default timezone('utc', now()) not null,
    updated_at timestamp with time zone default timezone('utc', now()) not null
);

-- Create indexes for better performance
create index if not exists idx_comments_post_id on public.comments(post_id);
create index if not exists idx_comments_user_id on public.comments(user_id);

-- Enable RLS
alter table public.comments enable row level security;

-- Set up RLS policies
create policy "Comments are viewable by post viewers"
    on comments for select
    using (
        exists (
            select 1 from public.posts
            where id = comments.post_id
            and (not is_private or auth.uid() = user_id)
        )
    );

create policy "Users can comment on posts"
    on comments for insert
    with check (
        exists (
            select 1 from public.posts
            where id = comments.post_id
            and (not is_private or auth.uid() = user_id)
        )
    );

create policy "Users can update own comments"
    on comments for update
    using (auth.uid() = user_id);

create policy "Users can delete own comments"
    on comments for delete
    using (auth.uid() = user_id);

-- Create trigger for updated_at
create trigger update_comments_updated_at
    before update on public.comments
    for each row
    execute function update_updated_at_column();

-- down.sql
/*
drop trigger if exists update_comments_updated_at on public.comments;
drop policy if exists "Users can delete own comments" on public.comments;
drop policy if exists "Users can update own comments" on public.comments;
drop policy if exists "Users can comment on posts" on public.comments;
drop policy if exists "Comments are viewable by post viewers" on public.comments;
drop index if exists idx_comments_user_id;
drop index if exists idx_comments_post_id;
drop table if exists public.comments;
*/
