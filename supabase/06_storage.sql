-- 1. Ensure required extension and column exist
create extension if not exists "uuid-ossp";

alter table storage.buckets 
  add column if not exists public boolean default false;

-- 2. Create storage buckets for post and profile images
insert into storage.buckets (id, name)
values 
  ('post-images', 'post-images'),
  ('profile-images', 'profile-images')
on conflict (id) do nothing;

-- 3. Set up storage policies for post images

-- Public: Anyone can view post images
create policy "Post images are publicly accessible"
    on storage.objects for select
    using (bucket_id = 'post-images');

-- Upload: Only authenticated users can upload to the 'post-images' bucket
create policy "Users can upload post images"
    on storage.objects for insert
    with check (
        bucket_id = 'post-images' 
        and auth.role() = 'authenticated'
    );

-- Delete: Only users owning the folder (assumed to be set to their user ID) can delete images
create policy "Users can delete own post images"
    on storage.objects for delete
    using (
        bucket_id = 'post-images'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- 4. Set up storage policies for profile images

-- Public: Profile images are publicly accessible
create policy "Profile images are publicly accessible"
    on storage.objects for select
    using (bucket_id = 'profile-images');

-- Upload: Only authenticated users can upload profile images into their own folder
create policy "Users can upload their own profile image"
    on storage.objects for insert
    with check (
        bucket_id = 'profile-images'
        and auth.role() = 'authenticated'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- Update: Only the owner (folder name) can update their profile image
create policy "Users can update their own profile image"
    on storage.objects for update
    using (
        bucket_id = 'profile-images'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- Delete: Only the owner (folder name) can delete their profile image
create policy "Users can delete their own profile image"
    on storage.objects for delete
    using (
        bucket_id = 'profile-images'
        and auth.uid()::text = (storage.foldername(name))[1]
    );