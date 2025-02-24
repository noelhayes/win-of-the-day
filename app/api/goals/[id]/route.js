import { createClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/goals/[id] - Get single goal
export async function GET(request, { params }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const goalId = params.id;

  try {
    const { data, error } = await supabase
      .from('goals')
      .select(`
        *,
        category:categories(id, name, color),
        linked_wins:linked_wins(
          post:posts(
            id,
            content,
            created_at,
            user:profiles(id, full_name, avatar_url)
          )
        )
      `)
      .eq('id', goalId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this goal
    if (data.user_id !== user.id && (data.is_private || !await checkIfFollowing(supabase, user.id, data.user_id))) {
      return NextResponse.json(
        { error: 'Unauthorized to view this goal' },
        { status: 403 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT /api/goals/[id] - Update goal
export async function PUT(request, { params }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const goalId = params.id;

  try {
    // First verify the goal belongs to the user
    const { data: goal, error: fetchError } = await supabase
      .from('goals')
      .select('user_id')
      .eq('id', goalId)
      .single();

    if (fetchError || !goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    if (goal.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this goal' },
        { status: 403 }
      );
    }

    const updates = await request.json();
    const allowedUpdates = [
      'title',
      'description',
      'timeframe_type',
      'start_date',
      'end_date',
      'category_id',
      'is_private',
      'is_active'
    ];

    // Filter out any non-allowed fields
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    // Validate dates if they're being updated
    if (filteredUpdates.start_date && filteredUpdates.end_date) {
      if (new Date(filteredUpdates.end_date) <= new Date(filteredUpdates.start_date)) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from('goals')
      .update(filteredUpdates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    // Check for the active goals limit constraint violation
    if (error.code === '23514' && error.message.includes('active_goals_limit')) {
      return NextResponse.json(
        { error: 'You can have at most 10 active goals' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE /api/goals/[id] - Delete goal
export async function DELETE(request, { params }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const goalId = params.id;

  try {
    // First verify the goal belongs to the user
    const { data: goal, error: fetchError } = await supabase
      .from('goals')
      .select('user_id')
      .eq('id', goalId)
      .single();

    if (fetchError || !goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    if (goal.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this goal' },
        { status: 403 }
      );
    }

    // Delete the goal (linked_wins will be cascade deleted due to FK constraint)
    const { error: deleteError } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

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
