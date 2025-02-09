import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authLogger as logger } from '../../../utils/logger';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  logger.info('Auth callback initiated', {
    hasCode: !!code,
    url: requestUrl.pathname,
    searchParams: Object.fromEntries(requestUrl.searchParams)
  });

  if (code) {
    const cookieStore = cookies();
    const response = NextResponse.redirect(new URL('/feed', request.url));

    // Log existing cookies
    const existingCookies = cookieStore.getAll();
    logger.debug('Existing cookies', {
      cookies: existingCookies.map(c => ({
        name: c.name,
        options: { path: c.path, domain: c.domain }
      }))
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            const cookie = cookieStore.get(name)?.value;
            logger.cookieOperation('get', name, { value: cookie ? 'present' : 'missing' });
            return cookie;
          },
          set(name, value, options) {
            try {
              const cookieOptions = {
                ...options,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
              };

              logger.cookieOperation('set', name, cookieOptions);

              response.cookies.set({
                name,
                value,
                ...cookieOptions,
              });
            } catch (error) {
              logger.error('Failed to set cookie', error, { cookieName: name });
            }
          },
          remove(name, options) {
            try {
              const cookieOptions = {
                ...options,
                path: '/',
              };

              logger.cookieOperation('remove', name, cookieOptions);

              response.cookies.delete({
                name,
                ...cookieOptions,
              });
            } catch (error) {
              logger.error('Failed to remove cookie', error, { cookieName: name });
            }
          },
        },
      }
    );
    
    try {
      logger.debug('Exchanging code for session');
      const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (authError) {
        logger.error('Auth exchange failed', authError);
        return NextResponse.redirect(new URL('/?error=auth', request.url));
      }

      if (!session) {
        logger.error('No session after exchange', null, { code });
        return NextResponse.redirect(new URL('/?error=no-session', request.url));
      }

      logger.info('Session established', {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at
      });

      // Check if profile exists
      logger.debug('Checking profile existence');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        logger.info('Creating new profile', { userId: session.user.id });
        
        const profileData = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata.full_name || 
                session.user.user_metadata.name || 
                session.user.email.split('@')[0],
          profile_image: session.user.user_metadata.avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: createError } = await supabase
          .from('profiles')
          .insert([profileData]);

        if (createError) {
          logger.error('Failed to create profile', createError, { profileData });
          // Continue anyway as this isn't critical
        } else {
          logger.info('Profile created successfully', { profileId: profileData.id });
        }
      } else if (profileError) {
        logger.error('Failed to check profile', profileError);
      } else {
        logger.info('Profile exists', { profileId: profile.id });
      }

      // Log the response cookies before returning
      logger.debug('Response cookies', {
        cookies: Array.from(response.cookies.getAll()).map(c => ({
          name: c.name,
          options: { path: c.path, domain: c.domain }
        }))
      });

      return response;
    } catch (error) {
      logger.error('Callback processing failed', error);
      return NextResponse.redirect(new URL('/?error=unknown', request.url));
    }
  }

  logger.warn('No code provided in callback');
  return NextResponse.redirect(new URL('/?error=no-code', request.url));
}
