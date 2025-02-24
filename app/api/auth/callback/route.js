import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';
import { authLogger as logger } from '../../../../utils/logger';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Log all relevant information about the request
  logger.info('Auth callback initiated', {
    hasCode: !!code,
    hasError: !!error,
    url: request.url,
    origin: requestUrl.origin,
    pathname: requestUrl.pathname,
    searchParams: Object.fromEntries(requestUrl.searchParams),
    headers: Object.fromEntries(request.headers),
    env: process.env.NODE_ENV,
    isDev: process.env.NODE_ENV === 'development',
    VERCEL_URL: process.env.VERCEL_URL
  });

  // Handle auth errors
  if (error) {
    logger.error('Auth error from provider', { error, error_description });
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, requestUrl.origin));
  }

  if (!code) {
    logger.error('No code provided');
    return NextResponse.redirect(new URL('/?error=no_code', requestUrl.origin));
  }

  const cookieStore = cookies();
  const response = NextResponse.redirect(new URL('/feed', requestUrl.origin));

  try {
    // Create Supabase client with cookie store and response
    const supabase = await createClient(cookieStore, response);

    logger.info('Exchanging code for session...');
    const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (authError) {
      logger.error('Auth exchange failed', { 
        error: authError,
        code: authError.code,
        message: authError.message
      });
      return NextResponse.redirect(new URL('/?error=auth', requestUrl.origin));
    }

    if (!session) {
      logger.error('No session established');
      return NextResponse.redirect(new URL('/?error=no-session', requestUrl.origin));
    }

    logger.info('Session established', {
      userId: session.user.id,
      email: session.user.email
    });

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, onboarded')
      .eq('id', session.user.id)
      .single();

    // Create profile if it doesn't exist
    if (!profile && !profileError) {
      const { error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: session.user.id,
            email: session.user.email,
            username: session.user.email.split('@')[0],
            name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            onboarded: false
          }
        ]);

      if (createError) {
        logger.error('Error creating profile', { error: createError });
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
      }

      logger.info('Created new profile', { userId: session.user.id });
      return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
    }

    // Redirect to onboarding if not completed
    if (profile && !profile.onboarded) {
      logger.info('User not onboarded, redirecting', { userId: session.user.id });
      return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
    }

    logger.info('Auth flow complete, redirecting to feed', { userId: session.user.id });
    return response;

  } catch (error) {
    logger.error('Unexpected error in auth callback', { error });
    return NextResponse.redirect(new URL('/?error=unexpected', requestUrl.origin));
  }
}
