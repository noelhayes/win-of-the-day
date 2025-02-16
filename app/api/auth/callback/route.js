import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';
import { authLogger as logger } from '../../../../utils/logger';
import { getSiteUrl } from '../../../../utils/config';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  // Log all relevant information about the request
  logger.info('Auth callback initiated', {
    hasCode: !!code,
    url: request.url,
    origin: requestUrl.origin,
    pathname: requestUrl.pathname,
    searchParams: Object.fromEntries(requestUrl.searchParams),
    headers: Object.fromEntries(request.headers),
    env: process.env.NODE_ENV,
    isDev: process.env.NODE_ENV === 'development',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL_URL: process.env.VERCEL_URL
  });

  if (code) {
    const cookieStore = cookies();
    
    // For preview deployments, use the request's origin
    // This ensures we stay on the same preview URL
    let baseUrl;
    if (
      process.env.VERCEL_URL &&
      process.env.VERCEL_ENV === 'preview' &&
      requestUrl.origin.includes(process.env.VERCEL_URL)
    ) {
      baseUrl = requestUrl.origin;
      logger.info('Using request origin for preview deployment', { 
        baseUrl,
        vercelEnv: process.env.VERCEL_ENV 
      });
    } else {
      baseUrl = getSiteUrl();
      logger.info('Using getSiteUrl for base URL', { 
        baseUrl,
        vercelEnv: process.env.VERCEL_ENV 
      });
    }

    logger.info('Final redirect configuration', { 
      baseUrl, 
      env: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      isDev: process.env.NODE_ENV === 'development',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      requestOrigin: requestUrl.origin,
      redirectUrl: new URL('/feed', baseUrl).toString()
    });

    const response = NextResponse.redirect(new URL('/feed', baseUrl));

    // Create Supabase client with cookie store and response
    const supabase = await createClient(cookieStore, response);

    try {
      logger.info('Exchanging code for session...');
      const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (authError) {
        logger.error('Auth exchange failed', { 
          error: authError,
          code: authError.code,
          message: authError.message,
          env: process.env.NODE_ENV
        });
        return NextResponse.redirect(new URL('/?error=auth', baseUrl));
      }

      if (!session) {
        logger.error('No session established', {
          env: process.env.NODE_ENV,
          baseUrl
        });
        return NextResponse.redirect(new URL('/?error=no-session', baseUrl));
      }

      logger.info('Session established', {
        userId: session.user.id,
        email: session.user.email,
        env: process.env.NODE_ENV,
        baseUrl
      });

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, onboarded')
        .eq('id', session.user.id)
        .single();

      // Create profile if it doesn't exist
      if (profileError && profileError.code === 'PGRST116') {
        logger.info('Creating new profile', { 
          userId: session.user.id,
          env: process.env.NODE_ENV,
          baseUrl
        });
        
        const profileData = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata.full_name || 
                session.user.user_metadata.name || 
                session.user.email.split('@')[0],
          profile_image: session.user.user_metadata.avatar_url,
          onboarded: true, // Set to true by default since we're skipping onboarding
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: createError } = await supabase
          .from('profiles')
          .insert([profileData]);

        if (createError) {
          logger.error('Failed to create profile', {
            error: createError,
            userId: session.user.id,
            env: process.env.NODE_ENV,
            baseUrl
          });
          return response;
        }

        logger.info('Profile created successfully', { 
          userId: session.user.id,
          env: process.env.NODE_ENV,
          baseUrl
        });
        return response; // Return to /feed instead of /onboarding
      }

      if (profileError) {
        logger.error('Failed to check profile', {
          error: profileError,
          userId: session.user.id,
          env: process.env.NODE_ENV,
          baseUrl
        });
        return response;
      }

      return response;
    } catch (error) {
      logger.error('Callback processing failed', {
        error,
        stack: error.stack,
        env: process.env.NODE_ENV,
        baseUrl
      });
      return NextResponse.redirect(new URL('/?error=unknown', baseUrl));
    }
  }

  logger.error('No code provided', {
    env: process.env.NODE_ENV,
    url: request.url,
    headers: Object.fromEntries(request.headers)
  });
  const baseUrl = getSiteUrl();
  return NextResponse.redirect(new URL('/?error=no-code', baseUrl));
}
