import { createClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const { is_read } = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
