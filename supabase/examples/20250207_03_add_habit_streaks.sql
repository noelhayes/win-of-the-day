-- Migration: Add habit streaks
-- Description: Add streak tracking to habits
-- up.sql

-- Add streak columns to habits table
alter table public.habits
add column if not exists current_streak integer default 0,
add column if not exists longest_streak integer default 0,
add column if not exists last_completion_date date;

-- Create function to update streaks
create or replace function update_habit_streak()
returns trigger as $$
declare
    last_completion date;
    days_since_last integer;
begin
    -- Get the last completion date before this one
    select completed_at::date into last_completion
    from public.habit_completions
    where habit_id = new.habit_id
    and completed_at < new.completed_at
    order by completed_at desc
    limit 1;

    -- Update the habit's streak information
    update public.habits
    set
        last_completion_date = new.completed_at::date,
        current_streak = case
            when last_completion_date is null then 1
            when last_completion_date = (new.completed_at::date - interval '1 day')::date then current_streak + 1
            when last_completion_date = new.completed_at::date then current_streak
            else 1
        end,
        longest_streak = greatest(
            longest_streak,
            case
                when last_completion_date is null then 1
                when last_completion_date = (new.completed_at::date - interval '1 day')::date then current_streak + 1
                when last_completion_date = new.completed_at::date then current_streak
                else 1
            end
        )
    where id = new.habit_id;

    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for streak updates
create trigger update_habit_streak_on_completion
    after insert on public.habit_completions
    for each row
    execute function update_habit_streak();

-- down.sql
/*
drop trigger if exists update_habit_streak_on_completion on public.habit_completions;
drop function if exists update_habit_streak();
alter table public.habits
    drop column if exists current_streak,
    drop column if exists longest_streak,
    drop column if exists last_completion_date;
*/
