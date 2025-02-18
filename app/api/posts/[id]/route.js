import { createClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(
  request,
  { params }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const postId = params.id;

  try {
    // First verify the post belongs to the user
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this post' },
        { status: 403 }
      );
    }

    // Delete the post (likes will be cascade deleted due to FK constraint)
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
