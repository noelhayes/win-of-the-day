-- Enable RLS
alter table if exists public.posts enable row level security;

-- Drop existing tables if they exist
drop table if exists public.posts cascade;

-- Create posts table
create table public.posts (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    content text not null,
    category_id uuid references public.categories(id),
    is_private boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

-- Create trigger for updated_at
create trigger handle_updated_at
    before update on public.posts
    for each row
    execute function public.handle_updated_at();

-- Create indexes
create index posts_user_id_idx on public.posts(user_id);
create index posts_category_id_idx on public.posts(category_id);
create index posts_created_at_idx on public.posts(created_at desc);

-- RLS Policies

-- Allow users to view their own posts and public posts of others
create policy "Users can view their own posts and public posts of others"
    on public.posts for select
    using (
        auth.uid() = user_id 
        or (not is_private and auth.role() = 'authenticated')
    );

-- Allow users to insert their own posts
create policy "Users can insert their own posts"
    on public.posts for insert
    with check (auth.uid() = user_id);

-- Allow users to update their own posts
create policy "Users can update their own posts"
    on public.posts for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Allow users to delete their own posts
create policy "Users can delete their own posts"
    on public.posts for delete
    using (auth.uid() = user_id);

-- Grant permissions
grant all on public.posts to authenticated;
grant all on public.posts to service_role;
