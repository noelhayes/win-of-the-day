-- Drop existing tables if they exist
drop table if exists public.post_images;
drop table if exists public.likes;
drop table if exists public.posts;

-- Create posts table
create table if not exists public.posts (
    id uuid default gen_random_uuid() primary key,
    content text not null check (char_length(content) <= 1000),
    user_id uuid not null,
    category_id uuid references public.categories(id),
    is_private boolean default false,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    updated_at timestamp with time zone default timezone('utc', now()) not null,
    foreign key (user_id) references auth.users(id) on delete cascade
);

-- Create post_images table
create table if not exists public.post_images (
    id uuid default uuid_generate_v4() primary key,
    post_id uuid references public.posts(id) on delete cascade not null,
    image_url text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

begin;
    -- Drop the existing foreign key constraints
    alter table public.posts 
    drop constraint if exists posts_user_id_fkey;

    alter table public.likes
    drop constraint if exists likes_user_id_fkey;

    -- Add the new foreign key constraints
    alter table public.posts
    add constraint posts_user_id_fkey 
    foreign key (user_id) 
    references auth.users(id) 
    on delete cascade;

    alter table public.likes
    add constraint likes_user_id_fkey
    foreign key (user_id)
    references auth.users(id)
    on delete cascade;
commit;

-- Enable RLS
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.post_images enable row level security;

-- Drop existing policies
drop policy if exists "Public posts are viewable by everyone" on posts;
drop policy if exists "Users can create posts" on posts;
drop policy if exists "Users can update own posts" on posts;
drop policy if exists "Users can delete own posts" on posts;
drop policy if exists "Likes are viewable by everyone" on likes;
drop policy if exists "Users can like posts" on likes;
drop policy if exists "Users can unlike posts" on likes;
drop policy if exists "Post images are viewable by post viewers" on post_images;
drop policy if exists "Users can add images to own posts" on post_images;
drop policy if exists "Users can delete images from own posts" on post_images;

-- Set up RLS policies for posts
create policy "Public posts are viewable by everyone"
    on posts for select
    using (not is_private or auth.uid() = user_id);

create policy "Users can create posts"
    on posts for insert
    with check (auth.uid() = user_id);

create policy "Users can update own posts"
    on posts for update
    using (auth.uid() = user_id)
    with check (
        auth.uid() = user_id
        and (
            -- Allow updating content, category, privacy, and updated_at
            (content is not null and char_length(content) <= 1000)
            and (category_id is null or category_id in (select id from public.categories))
            and (is_private is not null)
            and (updated_at is not null)
            -- Prevent updating user_id and created_at
            and user_id = (select user_id from public.posts where id = id)
            and created_at = (select created_at from public.posts where id = id)
        )
    );

create policy "Users can delete own posts"
    on posts for delete
    using (auth.uid() = user_id);

-- Set up RLS policies for likes
create policy "Likes are viewable by everyone"
    on likes for select
    using (true);

create policy "Users can like posts"
    on likes for insert
    with check (auth.uid() = user_id);

create policy "Users can unlike posts"
    on likes for delete
    using (auth.uid() = user_id);

-- Set up RLS policies for post images
create policy "Post images are viewable by post viewers"
    on post_images for select
    using (
        exists (
            select 1 from public.posts
            where id = post_images.post_id
            and (not is_private or auth.uid() = user_id)
        )
    );

create policy "Users can add images to own posts"
    on post_images for insert
    with check (
        exists (
            select 1 from public.posts
            where id = post_images.post_id
            and auth.uid() = user_id
        )
    );

create policy "Users can delete images from own posts"
    on post_images for delete
    using (
        exists (
            select 1 from public.posts
            where id = post_images.post_id
            and auth.uid() = user_id
        )
    );

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Create trigger to automatically update updated_at
drop trigger if exists on_post_update on posts;
create trigger on_post_update
    before update on posts
    for each row
    execute function handle_updated_at();
