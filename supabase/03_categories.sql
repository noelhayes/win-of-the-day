-- Drop existing tables if they exist
drop table if exists public.post_categories;
drop table if exists public.win_categories;

-- Create categories table
create table if not exists public.categories (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    color text not null,
    icon text not null,
    created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Enable RLS
alter table public.categories enable row level security;

-- Set up RLS policies
create policy "Categories are viewable by everyone"
    on categories for select
    using (true);

-- Insert default categories
insert into public.categories (name, color, icon) values
    ('Work', '#4F46E5', '💼'),
    ('Health', '#10B981', '🏃‍♂️'),
    ('Learning', '#F59E0B', '📚'),
    ('Relationships', '#EC4899', '❤️'),
    ('Personal', '#8B5CF6', '🎯'),
    ('Finance', '#059669', '💰'),
    ('Creativity', '#F97316', '🎨'),
    ('Other', '#6B7280', '✨')
on conflict (name) do update set
    color = excluded.color,
    icon = excluded.icon;
