-- Insert initial win categories if they don't exist
insert into public.win_categories (name, color, icon)
select 'Career', '#10B981', 'briefcase'
where not exists (
    select 1 from public.win_categories where name = 'Career'
);

insert into public.win_categories (name, color, icon)
select 'Health', '#EF4444', 'heart'
where not exists (
    select 1 from public.win_categories where name = 'Health'
);

insert into public.win_categories (name, color, icon)
select 'Personal Growth', '#8B5CF6', 'star'
where not exists (
    select 1 from public.win_categories where name = 'Personal Growth'
);
