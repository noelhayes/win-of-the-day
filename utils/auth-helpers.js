/**
 * @typedef {import('@supabase/supabase-js').User} User
 * @typedef {import('@supabase/supabase-js').Session} Session
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Error class for auth-related errors
 */
class AuthError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Creates or ensures a user profile exists
 * @param {User} user - The authenticated user object
 * @throws {AuthError} If profile creation fails
 */
export async function ensureProfile(user) {
  if (!user?.id) {
    throw new AuthError('Invalid user object provided', 'INVALID_USER');
  }

  try {
    console.log('ensureProfile called with user:', {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata,
      identities: user.identities
    });

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

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('Middleware: Profile check result:', {
      existingProfile,
      profileCheckError: profileError
    });

    if (!existingProfile && profileError?.code === 'PGRST116') {
      console.log('Middleware: Profile not found, creating new profile...');

      // Get the display name from user metadata
      const displayName = user.user_metadata?.full_name || 
                         user.user_metadata?.name || 
                         user.email?.split('@')[0] || 
                         'Anonymous User';

      // Create new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            name: displayName,
            email: user.email,
            profile_image: user.user_metadata?.avatar_url || user.user_metadata?.picture
          }
        ]);

      if (insertError) {
        console.error('Error creating profile:', insertError);
        throw new AuthError('Failed to create user profile', 'PROFILE_CREATION_FAILED', insertError);
      }

      return {
        id: user.id,
        name: displayName,
        email: user.email,
        profile_image: user.user_metadata?.avatar_url || user.user_metadata?.picture
      };
    }

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    return existingProfile;
  } catch (error) {
    console.error('Unexpected error in ensureProfile:', error);
    throw new AuthError('Unexpected error while managing user profile', 'UNEXPECTED_ERROR', error);
  }
}

/**
 * Updates a user's profile
 * @param {string} userId - The user's ID
 * @param {Object} updates - The profile updates to apply
 * @returns {Promise<Object>} The updated profile
 * @throws {AuthError} If profile update fails
 */
export async function updateProfile(userId, updates) {
  if (!userId) {
    throw new AuthError('User ID is required', 'INVALID_USER_ID');
  }

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

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new AuthError('Failed to update profile', 'PROFILE_UPDATE_FAILED', error);
  }
}

/**
 * Gets a user's profile
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} The user's profile
 * @throws {AuthError} If profile retrieval fails
 */
export async function getProfile(userId) {
  if (!userId) {
    throw new AuthError('User ID is required', 'INVALID_USER_ID');
  }

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

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new AuthError('Failed to get profile', 'PROFILE_RETRIEVAL_FAILED', error);
  }
}
