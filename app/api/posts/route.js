// app/api/posts/route.js
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // Get the current session using Supabase's auth helper
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const body = await request.json();
  const { content } = body;
  
  if (!content) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }
  
  // Notice we use "user_id" to match your database schema.
  const { data, error } = await supabase
    .from('posts')
    .insert([{ user_id: session.user.id, content }])
    .single();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data, { status: 201 });
}
