-- Create follows table
create table if not exists public.follows (
    id uuid default gen_random_uuid() primary key,
    follower_id uuid references public.profiles(id) on delete cascade not null,
    following_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    unique(follower_id, following_id)
);

-- Create indexes for better performance
create index if not exists idx_follows_follower on public.follows(follower_id);
create index if not exists idx_follows_following on public.follows(following_id);

-- Enable RLS
alter table public.follows enable row level security;

-- Set up RLS policies for follows
create policy "Users can see all follows"
    on follows for select
    using (true);

create policy "Users can follow others"
    on follows for insert
    with check (auth.uid() = follower_id);

create policy "Users can unfollow"
    on follows for delete
    using (auth.uid() = follower_id);
