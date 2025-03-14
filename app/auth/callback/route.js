import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const cookieStore = cookies();
  let response = NextResponse.next();

  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    const next = requestUrl.searchParams.get('next') || '/feed';

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL('/?error=auth', requestUrl.origin));
    }

    if (code) {
      // Create Supabase client with standardized cookie handling
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            get: () => null,
            getAll: () => {
              const cookies = {};
              cookieStore.getAll().forEach((cookie) => {
                cookies[cookie.name] = cookie.value;
              });
              return cookies;
            },
            set: () => null,
            setAll: (cookiesList) => {
              response = NextResponse.next();

              cookiesList.forEach((cookie) => {
                response.cookies.set({
                  ...cookie,
                  path: '/',
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                  maxAge: 7 * 24 * 60 * 60 // 7 days
                });
              });

              return response;
            },
            remove: () => null,
            removeAll: () => null
          }
        }
      );

      // Exchange the code for a session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError.message);
        return NextResponse.redirect(new URL('/?error=auth', requestUrl.origin));
      }

      // Get the session to verify authentication worked
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('Session verification error:', sessionError?.message || 'No session found');
        return NextResponse.redirect(new URL('/?error=auth', requestUrl.origin));
      }

      // Log the redirect URL for debugging
      console.log('Auth callback success, redirecting to:', {
        next,
        origin: requestUrl.origin,
        fullUrl: new URL(next, requestUrl.origin).toString(),
        env: process.env.NODE_ENV,
      });

      // Successful authentication, redirect to next page with cookies
      const redirectUrl = new URL(next, requestUrl.origin);
      const redirectResponse = NextResponse.redirect(redirectUrl);

      // Copy cookies from response to redirectResponse
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set({
          name: cookie.name,
          value: cookie.value,
          ...cookie,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 // 7 days
        });
      });

      return redirectResponse;
    }

    // No code or error, redirect to home
    return NextResponse.redirect(new URL('/', requestUrl.origin));
  } catch (error) {
    console.error('Auth callback error:', error.message);
    return NextResponse.redirect(new URL('/?error=auth', request.url));
  }
}
