import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { ensureProfile } from '../auth-helpers';

export async function updateSession(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
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
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.delete({ name, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.delete({ name, ...options });
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    if (userError.name === 'AuthSessionMissingError') {
      // This is expected during static page generation
      console.log('No auth session (expected during static generation)');
      return response;
    }
    console.error('Error getting user in middleware:', userError);
    return response;
  }

  if (user) {
    console.log('Middleware: User found', {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata,
      identities: user.identities
    });

    try {
      // Check if profile exists before trying to create it
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('Middleware: Profile check result:', { existingProfile, profileCheckError });

      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is expected if profile doesn't exist
        console.error('Middleware: Error checking profile:', profileCheckError);
      }

      if (!existingProfile) {
        console.log('Middleware: Profile not found, creating new profile...');
        await ensureProfile(user);
      } else {
        console.log('Middleware: Profile already exists');
      }
    } catch (error) {
      console.error('Middleware: Error in profile creation flow:', error);
    }
  } else {
    console.log('Middleware: No user found');
  }

  return response;
}
