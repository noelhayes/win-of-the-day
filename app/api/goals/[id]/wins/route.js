import { createClient } from '../../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/goals/[id]/wins - List wins linked to a goal
export async function GET(request, { params }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const goalId = params.id;

  try {
    // First check if user has access to this goal
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('user_id, is_private')
      .eq('id', goalId)
      .single();

    if (goalError || !goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this goal
    if (goal.user_id !== user.id && (goal.is_private || !await checkIfFollowing(supabase, user.id, goal.user_id))) {
      return NextResponse.json(
        { error: 'Unauthorized to view this goal' },
        { status: 403 }
      );
    }

    // Get linked wins with pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const { data: wins, error: winsError } = await supabase
      .from('linked_wins')
      .select(`
        post:posts(
          id,
          content,
          created_at,
          user:profiles(id, full_name, avatar_url)
        )
      `)
      .eq('goal_id', goalId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (winsError) throw winsError;

    return NextResponse.json(wins.map(w => w.post));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// POST /api/goals/[id]/wins - Link a win to a goal
export async function POST(request, { params }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const goalId = params.id;

  try {
    const { post_id } = await request.json();
    
    if (!post_id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Verify the goal belongs to the user
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('user_id')
      .eq('id', goalId)
      .single();

    if (goalError || !goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    if (goal.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to link wins to this goal' },
        { status: 403 }
      );
    }

    // Verify the post belongs to the user
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to link this post' },
        { status: 403 }
      );
    }

    // Create the link
    const { data, error } = await supabase
      .from('linked_wins')
      .insert([{
        post_id,
        goal_id: goalId
      }])
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This win is already linked to the goal' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE /api/goals/[id]/wins/[postId] - Unlink a win from a goal
export async function DELETE(request, { params }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const goalId = params.id;
  const postId = params.postId;

  try {
    // Verify the goal belongs to the user
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('user_id')
      .eq('id', goalId)
      .single();

    if (goalError || !goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    if (goal.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to unlink wins from this goal' },
        { status: 403 }
      );
    }

    // Delete the link
    const { error: deleteError } = await supabase
      .from('linked_wins')
      .delete()
      .eq('goal_id', goalId)
      .eq('post_id', postId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// Helper function to check if user is following another user
async function checkIfFollowing(supabase, followerId, followingId) {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  return !error && data;
}
