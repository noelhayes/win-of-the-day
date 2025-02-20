create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null, -- target user who should see the notification
  type text not null,    -- e.g., 'like', 'follow_request'
  trigger_user_id uuid not null, -- user who triggered the notification
  reference_id uuid,     -- optional: e.g., post id or follow request id
  message text,          -- human-readable message (optional)
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

ALTER TABLE public.notifications
ADD COLUMN follow_request_status text;

alter table public.notifications
  add constraint notifications_user_fk
  foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.notifications
  add constraint notifications_trigger_user_fkey
  foreign key (trigger_user_id) references public.profiles(id) on delete cascade;

create index if not exists idx_notifications_user_read on public.notifications(user_id, is_read);

alter table public.notifications enable row level security;

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their received follow requests"
ON public.follow_requests FOR UPDATE
USING (auth.uid() = to_user)
WITH CHECK (auth.uid() = to_user);

create policy "Notifications are viewable by owner"
  on public.notifications for select
  using (auth.uid() = user_id);

-- This ensures that only the backend (Supabase's service role) can insert notifications via triggers
-- Users themselves cannot manually insert notifications, preventing abuse.
create policy "Server can insert notifications"
  on public.notifications for insert
  with check (auth.role() = 'service_role');

create or replace function public.notify_like() 
returns trigger 
language plpgsql security definer
as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from public.posts where id = NEW.post_id;
  
  if post_owner is not null and post_owner <> NEW.user_id then
    insert into public.notifications (user_id, type, trigger_user_id, reference_id, message)
    values (post_owner, 'like', NEW.user_id, NEW.post_id, 'Someone liked your post.');
  end if;
  return NEW;
end;
$$;

drop trigger if exists trigger_notify_like on public.likes;
create trigger trigger_notify_like
after insert on public.likes
for each row execute function public.notify_like();

-- Drop the old trigger if it exists
drop trigger if exists follow_request_trigger on public.follows;

CREATE OR REPLACE FUNCTION public.notify_follow_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a notification for the recipient (to_user)
  INSERT INTO public.notifications (
    user_id,
    trigger_user_id,
    type,
    reference_id,
    message
  )
  VALUES (
    NEW.to_user,         -- The user receiving the follow request
    NEW.from_user,       -- The user who sent the request
    'follow_request',    -- Notification type
    NEW.id,              -- Reference to the follow request record
    'You have a new follow request.'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DROP TRIGGER IF EXISTS follow_request_notification_trigger ON public.follow_requests;
CREATE TRIGGER follow_request_notification_trigger
AFTER INSERT ON public.follow_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_follow_request();

