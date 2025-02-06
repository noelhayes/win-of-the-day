-- Migration: 0002_example_changes.sql
-- Description: This is an example migration showing common database operations
-- Each operation is wrapped in a DO block to ensure idempotency

-- 1. Adding a new column to an existing table
do $$
begin
    if not exists (
        select 1
        from information_schema.columns
        where table_name = 'profiles'
        and column_name = 'bio'
    ) then
        alter table profiles add column bio text;
        comment on column profiles.bio is 'User biography or description';
    end if;
end
$$;

-- 2. Creating a new enum type
do $$
begin
    if not exists (
        select 1
        from pg_type
        where typname = 'notification_type'
    ) then
        create type notification_type as enum ('like', 'comment', 'follow', 'friend_request');
    end if;
end
$$;

-- 3. Creating a new table with foreign keys
do $$
begin
    if not exists (
        select 1
        from information_schema.tables
        where table_name = 'notifications'
    ) then
        create table notifications (
            id uuid default gen_random_uuid() primary key,
            user_id uuid references profiles(id) on delete cascade not null,
            actor_id uuid references profiles(id) on delete cascade not null,
            type notification_type not null,
            read boolean default false,
            data jsonb default '{}'::jsonb,
            created_at timestamp with time zone default timezone('utc', now()) not null
        );

        -- Create index for faster notification lookups
        create index if not exists idx_notifications_user_id on notifications(user_id);
        
        -- Add a comment to the table
        comment on table notifications is 'System notifications for user activities';
    end if;
end
$$;

-- 4. Adding a new column with a default value derived from other columns
do $$
begin
    if not exists (
        select 1
        from information_schema.columns
        where table_name = 'posts'
        and column_name = 'slug'
    ) then
        -- Add the column first
        alter table posts add column slug text;
        
        -- Update existing rows with a generated slug
        update posts
        set slug = replace(
            lower(
                case 
                    when length(content) <= 50 then content
                    else substring(content, 1, 50)
                end
            ),
            ' ',
            '-'
        )
        where slug is null;
        
        -- Make it non-null for future rows
        alter table posts alter column slug set not null;
        
        -- Add a unique index
        create unique index if not exists idx_posts_slug on posts(slug);
    end if;
end
$$;

-- 5. Modifying an existing column
do $$
begin
    -- Check if the column exists and has the old type
    if exists (
        select 1
        from information_schema.columns
        where table_name = 'habits'
        and column_name = 'frequency'
        and data_type = 'text'
    ) then
        -- Create the enum type if it doesn't exist
        if not exists (
            select 1
            from pg_type
            where typname = 'habit_frequency'
        ) then
            create type habit_frequency as enum ('daily', 'weekly', 'monthly');
        end if;

        -- Safely convert existing data
        alter table habits alter column frequency type habit_frequency 
        using (
            case frequency
                when 'daily' then 'daily'::habit_frequency
                when 'weekly' then 'weekly'::habit_frequency
                when 'monthly' then 'monthly'::habit_frequency
                else 'daily'::habit_frequency
            end
        );
    end if;
end
$$;

-- 6. Adding a new constraint
do $$
begin
    if not exists (
        select 1
        from information_schema.constraint_column_usage
        where table_name = 'profiles'
        and constraint_name = 'profiles_email_check'
    ) then
        alter table profiles
        add constraint profiles_email_check
        check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    end if;
end
$$;

-- 7. Creating a new function and trigger
do $$
begin
    -- Create or replace the function
    create or replace function update_updated_at()
    returns trigger
    language plpgsql
    as $$
    begin
        new.updated_at = timezone('utc', now());
        return new;
    end;
    $$;

    -- Create the trigger if it doesn't exist
    if not exists (
        select 1
        from pg_trigger
        where tgname = 'set_updated_at'
        and tgrelid = 'posts'::regclass
    ) then
        create trigger set_updated_at
        before update on posts
        for each row
        execute function update_updated_at();
    end if;
end
$$;

-- 8. Adding a new policy
do $$
begin
    if not exists (
        select 1
        from pg_policies
        where policyname = 'users_can_view_own_notifications'
        and tablename = 'notifications'
    ) then
        create policy users_can_view_own_notifications
        on notifications
        for select
        to authenticated
        using (user_id = auth.uid());
    end if;
end
$$;
