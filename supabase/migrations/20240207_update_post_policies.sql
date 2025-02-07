-- Update post visibility policies
begin;
    -- Drop existing post visibility policy
    drop policy if exists "Public posts are viewable by everyone" on posts;

    -- Create new policy for post visibility
    create policy "Posts are viewable by followers and post owner"
        on posts for select
        using (
            auth.uid() = user_id -- User can see their own posts
            or (
                exists ( -- User follows the post creator
                    select 1 from public.follows
                    where follower_id = auth.uid()
                    and following_id = posts.user_id
                )
            )
        );

    -- Update post images policy to match post visibility
    drop policy if exists "Post images are viewable by post viewers" on post_images;
    
    create policy "Post images are viewable by post owner and followers"
        on post_images for select
        using (
            exists (
                select 1 from public.posts
                where id = post_images.post_id
                and (
                    auth.uid() = user_id -- Post owner can see images
                    or (
                        exists ( -- Followers can see images
                            select 1 from public.follows
                            where follower_id = auth.uid()
                            and following_id = posts.user_id
                        )
                    )
                )
            )
        );
commit;
