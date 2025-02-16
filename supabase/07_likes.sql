-- Create likes table if it doesn't exist
create table if not exists public.likes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    post_id uuid references public.posts(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    unique(user_id, post_id)
);

ALTER TABLE public.likes
  ADD CONSTRAINT likes_profile_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;


-- Create indexes for performance
create index if not exists idx_likes_user on public.likes(user_id);
create index if not exists idx_likes_post on public.likes(post_id);

-- Enable Row Level Security (RLS)
alter table public.likes enable row level security;

-- RLS policy: Everyone can see likes
create policy "Users can see all likes"
    on public.likes for select
    using (true);

-- RLS policy: Users can insert likes only if:
-- 1. They are acting as themselves (auth.uid() = user_id)
-- 2. They follow the post's author. We enforce this by joining the posts table to the follows table.
create policy "Users can like posts only if following"
    on public.likes for insert
    with check (
         auth.uid() = user_id
         and exists (
             select 1
             from public.follows f
             join public.posts p on p.user_id = f.following_id
             where f.follower_id = auth.uid() and p.id = post_id
         )
    );

-- RLS policy: Users can delete (i.e. unlike) their own likes
create policy "Users can unlike posts"
    on public.likes for delete
    using (auth.uid() = user_id);
