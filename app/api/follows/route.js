import { createClient } from '../../../utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// POST: Send a follow request
export async function POST(request) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { targetUserId } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }
    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }
    
    // Verify target user exists
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', targetUserId)
      .maybeSingle();
    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }
    
    // Check if a pending follow request already exists
    const { data: existingRequest } = await supabase
      .from('follow_requests')
      .select('*')
      .eq('from_user', user.id)
      .eq('to_user', targetUserId)
      .eq('status', 'pending')
      .maybeSingle();
    if (existingRequest) {
      return NextResponse.json({ error: 'Follow request already pending' }, { status: 400 });
    }
    
    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();
    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 });
    }
    
    // Insert new follow request
    const payload = { from_user: user.id, to_user: targetUserId };
    const { data: newRequest, error: insertError } = await supabase
      .from('follow_requests')
      .insert([payload])
      .select()
      .maybeSingle();
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    
    // Optionally, create a notification for the target user
    const notificationPayload = {
      user_id: targetUserId,
      type: 'follow_request',
      trigger_user_id: user.id,
      reference_id: newRequest.id,
      message: 'You have a new follow request.',
      is_read: false
    };
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert([notificationPayload]);
    if (notificationError) {
      console.error('Notification insertion error:', notificationError);
      // Notification failures do not stop the follow request.
    }
    
    return NextResponse.json({ message: 'Follow request sent successfully', data: newRequest });
  } catch (error) {
    console.error('Error in POST /api/follows:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Cancel a pending follow request or remove an established follow relationship
export async function DELETE(request) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { targetUserId } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }
    
    // Delete any pending follow request sent by the user
    const { error: deleteRequestError } = await supabase
      .from('follow_requests')
      .delete()
      .match({ from_user: user.id, to_user: targetUserId, status: 'pending' });
    if (deleteRequestError) {
      return NextResponse.json({ error: deleteRequestError.message }, { status: 500 });
    }
    
    // Also delete an established follow relationship if it exists
    const { error: deleteFollowError } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: user.id, following_id: targetUserId });
    if (deleteFollowError) {
      return NextResponse.json({ error: deleteFollowError.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Successfully unfollowed or cancelled follow request' });
  } catch (error) {
    console.error('Error in DELETE /api/follows:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Process (accept or reject) a pending follow request
export async function PATCH(request) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { requestId, action } = await request.json();
    if (!requestId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the follow request exists and is for this user
    const { data: followRequest, error: requestError } = await supabase
      .from('follow_requests')
      .select('*')
      .eq('id', requestId)
      .eq('to_user', user.id)
      .eq('status', 'pending')
      .single();

    if (requestError || !followRequest) {
      console.error('Error fetching follow request:', {
        error: requestError,
        notification_reference_id: requestId
      });
      return NextResponse.json({ error: 'Follow request not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (action === 'accept') {
      // Start a transaction to update both tables
      const { data: newFollow, error: followError } = await supabase
        .from('follows')
        .insert([
          {
            follower_id: followRequest.from_user,
            following_id: followRequest.to_user
          }
        ]);

      if (followError) {
        console.error('Error creating follow relationship:', followError);
        return NextResponse.json({ error: 'Failed to create follow relationship' }, { status: 500 });
      }

      // Update the request status
      const { error: updateError } = await supabase
        .from('follow_requests')
        .update({ 
          status: 'accepted',
          last_processed_at: now
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating follow request:', updateError);
        return NextResponse.json({ error: 'Failed to update follow request' }, { status: 500 });
      }

      return NextResponse.json({ status: 'accepted' });
    } else if (action === 'reject') {
      // Update the request status to declined
      const { error: updateError } = await supabase
        .from('follow_requests')
        .update({ 
          status: 'declined',
          last_processed_at: now
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating follow request:', updateError);
        return NextResponse.json({ error: 'Failed to update follow request' }, { status: 500 });
      }

      return NextResponse.json({ status: 'declined' });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing follow request action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Retrieve follow data
export async function GET(request) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  
  console.log('🔑 Checking authentication...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ Authentication failed:', authError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('✅ Authenticated as user:', user.id);
  
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'status';
    const targetUserId = url.searchParams.get('targetUserId');
    
    console.log('📝 Request params:', { type, targetUserId });

    // Status check for a specific target user
    if (type === 'status' && targetUserId) {
      console.log('🔍 Checking follow status:', { userId: user.id, targetUserId });
      
      try {
        // Check for pending request
        const { data: requests, error: pendingError } = await supabase
          .from('follow_requests')
          .select('*')
          .eq('from_user', user.id)
          .eq('to_user', targetUserId)
          .eq('status', 'pending');

        if (pendingError) {
          console.error('❌ Error checking pending request:', pendingError);
          throw pendingError;
        }

        console.log('📋 Pending requests:', requests);
        if (requests && requests.length > 0) {
          console.log('✅ Found pending request');
          return NextResponse.json({ status: 'pending' });
        }

        // If no pending request, check for existing follow
        const { data: follows, error: followError } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (followError) {
          console.error('❌ Error checking follow status:', followError);
          throw followError;
        }

        console.log('📋 Follow relationships:', follows);
        const status = (follows && follows.length > 0) ? 'following' : 'not_following';
        console.log('✅ Final status:', status);

        return NextResponse.json({ status });
      } catch (error) {
        console.error('❌ Error in status check:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    
    // Retrieve pending follow requests (both received and sent)
    if (type === 'requests') {
      const { data: received, error: receivedError } = await supabase
        .from('follow_requests')
        .select(`
          *,
          from_user:profiles!follow_requests_from_fk(id, username, name, profile_image)
        `)
        .eq('to_user', user.id)
        .eq('status', 'pending');
      if (receivedError) {
        return NextResponse.json({ error: receivedError.message }, { status: 500 });
      }
      
      const { data: sent, error: sentError } = await supabase
        .from('follow_requests')
        .select(`
          *,
          to_user:profiles!follow_requests_to_fk(id, username, name, profile_image)
        `)
        .eq('from_user', user.id)
        .eq('status', 'pending');
      if (sentError) {
        return NextResponse.json({ error: sentError.message }, { status: 500 });
      }
      
      return NextResponse.json({ received: received || [], sent: sent || [] });
    }
    
    // Retrieve established follow relationships (followers and following)
    if (type === 'relationships') {
      const { data: followers, error: followersError } = await supabase
        .from('follows')
        .select(`
          *,
          follower:profiles!follows_follower_id_fkey(id, username, name, profile_image)
        `)
        .eq('following_id', user.id);
      if (followersError) {
        return NextResponse.json({ error: followersError.message }, { status: 500 });
      }
      
      const { data: following, error: followingError } = await supabase
        .from('follows')
        .select(`
          *,
          following:profiles!follows_following_id_fkey(id, username, name, profile_image)
        `)
        .eq('follower_id', user.id);
      if (followingError) {
        return NextResponse.json({ error: followingError.message }, { status: 500 });
      }
      
      return NextResponse.json({ followers: followers || [], following: following || [] });
    }
    
    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error in GET /api/follows:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
