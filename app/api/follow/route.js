// app/api/follow/route.js
import { createClient } from '../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { targetUserId } = await request.json();

    const { error } = await supabase
      .from('follows')
      .insert([
        { follower_id: user.id, following_id: targetUserId }
      ]);

    if (error) throw error;

    return NextResponse.json({ message: 'Successfully followed user' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { targetUserId } = await request.json();

    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: user.id, following_id: targetUserId });

    if (error) throw error;

    return NextResponse.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
