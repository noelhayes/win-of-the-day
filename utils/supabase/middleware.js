import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { ensureProfile } from '../auth-helpers';

export async function updateSession(request) {
  // Ensure headers is a Headers instance
  const headers = new Headers(request.headers);
  
  let response = NextResponse.next({
    request: {
      headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.delete({ name, ...options });
          response = NextResponse.next({
            request: {
              headers,
            },
          });
          response.cookies.delete({ name, ...options });
        },
      },
    }
  );

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      // Handle session error
      return response;
    }

    if (user) {
      // Ensure user has a profile
      await ensureProfile(supabase, user);
    }

    return response;
  } catch (error) {
    console.error('Error in updateSession:', error);
    return response;
  }
}
