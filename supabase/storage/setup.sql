-- Create storage bucket for profile images if it doesn't exist
insert into storage.buckets (id, name)
select 'profile_images', 'profile_images'
where not exists (
    select 1 from storage.buckets where id = 'profile_images'
);

-- Create storage policies if they don't exist
do $$
begin
    -- Upload policy
    if not exists (
        select 1
        from pg_policies
        where policyname = 'Users can upload their own profile image'
        and tablename = 'objects'
        and schemaname = 'storage'
    ) then
        create policy "Users can upload their own profile image"
        on storage.objects for insert
        to authenticated
        with check (
            bucket_id = 'profile_images' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    end if;

    -- Update policy
    if not exists (
        select 1
        from pg_policies
        where policyname = 'Users can update their own profile image'
        and tablename = 'objects'
        and schemaname = 'storage'
    ) then
        create policy "Users can update their own profile image"
        on storage.objects for update
        to authenticated
        using (
            bucket_id = 'profile_images' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    end if;

    -- Delete policy
    if not exists (
        select 1
        from pg_policies
        where policyname = 'Users can delete their own profile image'
        and tablename = 'objects'
        and schemaname = 'storage'
    ) then
        create policy "Users can delete their own profile image"
        on storage.objects for delete
        to authenticated
        using (
            bucket_id = 'profile_images' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    end if;

    -- Select policy
    if not exists (
        select 1
        from pg_policies
        where policyname = 'Profile images are publicly accessible'
        and tablename = 'objects'
        and schemaname = 'storage'
    ) then
        create policy "Profile images are publicly accessible"
        on storage.objects for select
        to public
        using (bucket_id = 'profile_images');
    end if;
end
$$;
