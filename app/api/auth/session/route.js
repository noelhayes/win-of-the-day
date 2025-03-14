import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authLogger as logger } from '@/utils/logger';
import config from '@/utils/config';

export async function GET() {
  const cookieStore = cookies();
  const response = new NextResponse();

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => {
            const cookies = {};
            for (const cookie of cookieStore.getAll()) {
              cookies[cookie.name] = cookie.value;
            }
            return cookies;
          },
          setAll: (cookiesList) => {
            for (const { name, value, ...options } of cookiesList) {
              cookieStore.set({
                name,
                value,
                ...options,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
              });
            }
          },
        },
        auth: {
          flowType: 'pkce',
          autoRefreshToken: true,
          detectSessionInUrl: false,
          persistSession: true,
          site_url: config.baseUrl,
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      logger.error('Session error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    return NextResponse.json({ session }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    logger.error('Session handler error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
