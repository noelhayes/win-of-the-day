-- Create likes table if it doesn't exist
create table if not exists public.likes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    post_id uuid references public.posts(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    unique(user_id, post_id)
);

-- Create indexes for better performance
create index if not exists idx_likes_user on public.likes(user_id);
create index if not exists idx_likes_post on public.likes(post_id);

-- Enable RLS
alter table public.likes enable row level security;

-- Set up RLS policies for likes
create policy "Users can see all likes"
    on likes for select
    using (true);

create policy "Users can like posts"
    on likes for insert
    with check (auth.uid() = user_id);

create policy "Users can unlike posts"
    on likes for delete
    using (auth.uid() = user_id);

-- Add likes_count column to posts if it doesn't exist
alter table public.posts 
add column if not exists likes_count bigint default 0;

-- Create function to update post likes count
create or replace function public.handle_likes_count()
returns trigger
language plpgsql
security definer
as $$
begin
    if (TG_OP = 'INSERT') then
        update public.posts
        set likes_count = likes_count + 1
        where id = NEW.post_id;
    elsif (TG_OP = 'DELETE') then
        update public.posts
        set likes_count = likes_count - 1
        where id = OLD.post_id;
    end if;
    return null;
end;
$$;

-- Create trigger for likes count
drop trigger if exists on_like_change on public.likes;
create trigger on_like_change
    after insert or delete on public.likes
    for each row execute function public.handle_likes_count();
