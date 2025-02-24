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
    
-- Create a new policy that allows:
-- - The authenticated user is the follower (normal case), OR
-- - The authenticated user is the following user AND there exists a pending follow request 
--   from the follower to the following.
create policy "Users can follow others"
  on follows
  for insert
  with check (
    auth.uid() = follower_id OR
    (
      auth.uid() = following_id AND 
      exists (
        select 1 from follow_requests
        where follow_requests.from_user = follower_id
          and follow_requests.to_user = following_id
          and follow_requests.status = 'pending'
      )
    )
  );

create policy "Users can unfollow"
    on follows for delete
    using (auth.uid() = follower_id);
