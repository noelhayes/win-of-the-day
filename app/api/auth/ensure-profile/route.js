import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { apiLogger as logger } from '../../../../utils/logger';

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      logger.error('Failed to get user', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user) {
      logger.error('No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Checking profile existence', { userId: user.id });

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.error('Failed to check profile', profileError);
      return NextResponse.json(
        { error: 'Failed to check profile' },
        { status: 500 }
      );
    }

    if (!profile) {
      logger.info('Creating new profile', { userId: user.id });
      
      const profileData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || 
              user.user_metadata?.name || 
              user.email?.split('@')[0],
        profile_image: user.user_metadata?.avatar_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: createError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (createError) {
        logger.error('Failed to create profile', createError, { profileData });
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        );
      }

      logger.info('Profile created successfully', { profileId: user.id });
      return NextResponse.json({ status: 'created' });
    }

    logger.info('Profile exists', { profileId: profile.id });
    return NextResponse.json({ status: 'exists' });
  } catch (error) {
    logger.error('Ensure profile failed', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
