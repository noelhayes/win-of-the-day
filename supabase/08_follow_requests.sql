-- up.sql
create table if not exists public.follow_requests (
  id uuid default gen_random_uuid() primary key,
  from_user uuid not null,
  to_user uuid not null,
  status text default 'pending' not null,
  created_at timestamp with time zone default timezone('utc', now()) not null
  last_processed_at timestamp with time zone
);

alter table public.follow_requests
  add constraint follow_requests_from_fk foreign key (from_user) references public.profiles(id) on delete cascade;

alter table public.follow_requests
  add constraint follow_requests_to_fk foreign key (to_user) references public.profiles(id) on delete cascade;

alter table public.follow_requests enable row level security;

create policy "Follow requests are viewable by sender or recipient"
  on public.follow_requests for select
  using (auth.uid() = to_user OR auth.uid() = from_user);

create policy "Users can insert follow requests for themselves"
  on public.follow_requests for insert
  with check (auth.uid() = from_user);


CREATE OR REPLACE FUNCTION public.notify_follow_request_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when the status has changed from 'pending'
  IF NEW.status <> OLD.status THEN
    IF NEW.status = 'accepted' THEN
      UPDATE public.notifications
      SET 
        type = 'follow_request_accepted',
        message = 'Your follow request was accepted.',
        is_read = true  -- Optionally mark it as read
      WHERE reference_id = NEW.id;
    ELSIF NEW.status = 'rejected' THEN
      UPDATE public.notifications
      SET 
        type = 'follow_request_rejected',
        message = 'Your follow request was declined.',
        is_read = true
      WHERE reference_id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER follow_request_status_update_trigger
AFTER UPDATE ON public.follow_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_follow_request_update();
