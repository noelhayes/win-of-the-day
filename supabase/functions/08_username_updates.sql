-- Function to check if a user can update their username
create or replace function public.check_username_update_eligibility(user_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  last_update timestamptz;
begin
  -- Verify the user is checking their own eligibility
  if auth.uid() <> user_id then
    return false;
  end if;

  -- Get the last username update timestamp
  select username_updated_at into last_update
  from public.profiles
  where id = user_id;

  -- If never updated or last update was more than 30 days ago, return true
  return (
    last_update is null or
    last_update < timezone('utc', now()) - interval '30 days'
  );
end;
$$;

-- Function to automatically update username_updated_at timestamp
create or replace function public.update_username_timestamp()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Only allow updates for the authenticated user
  if auth.uid() <> NEW.id then
    raise exception 'You can only update your own username.';
  end if;

  -- Only update timestamp if username actually changed
  if NEW.username is distinct from OLD.username then
    -- Verify the user hasn't updated their username in the last 30 days
    if OLD.username_updated_at is not null and 
       OLD.username_updated_at > timezone('utc', now()) - interval '30 days' then
      raise exception 'You can only update your username once every 30 days.';
    end if;
    
    NEW.username_updated_at = timezone('utc', now());
  end if;
  return NEW;
end;
$$;

-- Create trigger for username updates
drop trigger if exists set_username_update_time on public.profiles;
create trigger set_username_update_time
  before update on public.profiles
  for each row
  execute function public.update_username_timestamp();

-- Enable RLS
alter table public.profiles enable row level security;

-- Add policies for username updates
create policy "Enable users to check their username update eligibility"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Enable users to update their own username"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id and
    (
      -- Allow update if username is not changing
      NEW.username is not distinct from OLD.username
      or
      -- Or if enough time has passed since last update
      OLD.username_updated_at is null
      or
      OLD.username_updated_at < timezone('utc', now()) - interval '30 days'
    )
  );
