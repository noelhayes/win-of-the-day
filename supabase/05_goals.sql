-- Create goals table
create type public.timeframe_type as enum ('monthly', 'quarterly', 'yearly', 'custom');

create table if not exists public.goals (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null,
    title text not null,
    description text,
    timeframe_type timeframe_type not null,
    start_date date not null,
    end_date date not null,
    category_id uuid,
    is_private boolean default false not null,
    is_active boolean default true not null,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    updated_at timestamp with time zone default timezone('utc', now()) not null,
    foreign key (user_id) references auth.users(id) on delete cascade,
    foreign key (category_id) references public.categories(id) on delete set null,
    constraint valid_timeframe check (end_date >= start_date),
    constraint active_goals_limit check (
        case when is_active then (
            select count(*) from public.goals g2 
            where g2.user_id = user_id 
            and g2.is_active = true 
            and g2.id != id
        ) < 10 else true end
    )
);

-- Create linked_wins junction table
create table if not exists public.linked_wins (
    id uuid default gen_random_uuid() primary key,
    post_id uuid not null,
    goal_id uuid not null,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    foreign key (post_id) references public.posts(id) on delete cascade,
    foreign key (goal_id) references public.goals(id) on delete cascade,
    unique(post_id, goal_id)
);

-- Enable RLS
alter table public.goals enable row level security;
alter table public.linked_wins enable row level security;

-- Set up RLS policies for goals

-- Users can view their own goals
create policy "Users can view own goals"
    on goals for select
    using (auth.uid() = user_id);

-- Users can view goals shared by users they follow
create policy "Users can view goals shared by users they follow"
    on goals for select
    using (
        not is_private 
        and exists (
            select 1 from public.follows
            where follower_id = auth.uid()
            and following_id = goals.user_id
        )
    );

-- Users can create goals
create policy "Users can create goals"
    on goals for insert
    with check (auth.uid() = user_id);

-- Users can update own goals
create policy "Users can update own goals"
    on goals for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Users can delete own goals
create policy "Users can delete own goals"
    on goals for delete
    using (auth.uid() = user_id);

-- Set up RLS policies for linked_wins

-- Users can view linked wins for goals they can see
create policy "Users can view linked wins for visible goals"
    on linked_wins for select
    using (
        exists (
            select 1 from public.goals
            where id = linked_wins.goal_id
            and (
                user_id = auth.uid()
                or (
                    not is_private
                    and exists (
                        select 1 from public.follows
                        where follower_id = auth.uid()
                        and following_id = goals.user_id
                    )
                )
            )
        )
    );

-- Users can link wins to their own goals
create policy "Users can link wins to own goals"
    on linked_wins for insert
    with check (
        exists (
            select 1 from public.goals
            where id = linked_wins.goal_id
            and user_id = auth.uid()
        )
        and
        exists (
            select 1 from public.posts
            where id = linked_wins.post_id
            and user_id = auth.uid()
        )
    );

-- Users can unlink wins from their own goals
create policy "Users can unlink wins from own goals"
    on linked_wins for delete
    using (
        exists (
            select 1 from public.goals
            where id = linked_wins.goal_id
            and user_id = auth.uid()
        )
    );

-- Create indexes for better query performance
create index goals_user_id_idx on public.goals(user_id);
create index goals_category_id_idx on public.goals(category_id);
create index goals_is_active_idx on public.goals(is_active);
create index linked_wins_post_id_idx on public.linked_wins(post_id);
create index linked_wins_goal_id_idx on public.linked_wins(goal_id);

-- Create function to update goals updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger handle_goals_updated_at
    before update on public.goals
    for each row
    execute function public.handle_updated_at();
