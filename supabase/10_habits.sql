-- Create habits table
create table if not exists public.habits (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null,
    name text not null,
    description text,
    frequency text not null,
    category_id uuid,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    updated_at timestamp with time zone default timezone('utc', now()) not null,
    foreign key (user_id) references auth.users(id) on delete cascade,
    foreign key (category_id) references public.categories(id) on delete set null
);

-- Create habit completions table
create table if not exists public.habit_completions (
    id uuid default gen_random_uuid() primary key,
    habit_id uuid references public.habits(id) on delete cascade not null,
    completed_at timestamp with time zone default timezone('utc', now()) not null,
    created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Enable RLS
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;

-- Set up RLS policies for habits
create policy "Users can view own habits"
    on habits for select
    using (auth.uid() = user_id);

create policy "Users can create habits"
    on habits for insert
    with check (auth.uid() = user_id);

create policy "Users can update own habits"
    on habits for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete own habits"
    on habits for delete
    using (auth.uid() = user_id);

-- Set up RLS policies for habit completions
create policy "Users can view own habit completions"
    on habit_completions for select
    using (
        exists (
            select 1 from public.habits
            where id = habit_completions.habit_id
            and auth.uid() = user_id
        )
    );

create policy "Users can mark habits as complete"
    on habit_completions for insert
    with check (
        exists (
            select 1 from public.habits
            where id = habit_completions.habit_id
            and auth.uid() = user_id
        )
    );

create policy "Users can delete habit completions"
    on habit_completions for delete
    using (
        exists (
            select 1 from public.habits
            where id = habit_completions.habit_id
            and auth.uid() = user_id
        )
    );
