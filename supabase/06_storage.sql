-- Create storage bucket for post images
insert into storage.buckets (id, name)
values ('post-images', 'post-images')
on conflict (id) do nothing;

-- Create storage bucket for profile images
insert into storage.buckets (id, name)
values ('profile-images', 'profile-images')
on conflict (id) do nothing;

-- Set up storage policies for post images
create policy "Post images are publicly accessible"
    on storage.objects for select
    using (bucket_id = 'post-images');

create policy "Users can upload post images"
    on storage.objects for insert
    with check (
        bucket_id = 'post-images' 
        and auth.role() = 'authenticated'
    );

create policy "Users can delete own post images"
    on storage.objects for delete
    using (
        bucket_id = 'post-images'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- Set up storage policies for profile images
create policy "Profile images are publicly accessible"
    on storage.objects for select
    using (bucket_id = 'profile-images');

create policy "Users can upload their own profile image"
    on storage.objects for insert
    with check (
        bucket_id = 'profile-images'
        and auth.role() = 'authenticated'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "Users can update their own profile image"
    on storage.objects for update
    using (
        bucket_id = 'profile-images'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "Users can delete their own profile image"
    on storage.objects for delete
    using (
        bucket_id = 'profile-images'
        and auth.uid()::text = (storage.foldername(name))[1]
    );
