import { createClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, markAll = false } = await request.json();
    if (!markAll && !notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }    

    if (markAll) {
      const { data, error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .select();

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'All notifications marked as read',
        data
      });
    } else {
      // First, verify the notification exists
      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select()
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        return NextResponse.json({ 
          error: 'Notification not found',
          details: fetchError.message 
        }, { status: 404 });
      }

      if (!notification) {
        return NextResponse.json({ 
          error: 'Notification not found' 
        }, { status: 404 });
      }

      // Then update it
      const { data: updatedNotification, error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .select();

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Notification marked as read',
        data: updatedNotification[0]
      });
    }
  } catch (error) {
    console.error('Error marking notification(s) as read:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark notification(s) as read' },
      { status: 500 }
    );
  }
}
