// app/api/posts/route.js
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request) {
  // Create a Supabase client that reads cookies from the request
  const supabase = createRouteHandlerClient({ cookies: request.cookies });
  
  // Get the current session from the request's cookies
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const body = await request.json();
  const { content } = body;
  if (!content) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }
  
  // Insert using the correct field name (user_id) as per your table schema
  const { data, error } = await supabase
    .from('posts')
    .insert([{ user_id: session.user.id, content }])
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data, { status: 201 });
}
