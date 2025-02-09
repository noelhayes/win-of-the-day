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
  try {
    const response = await fetch('/api/auth/ensure-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to ensure profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to ensure profile:', error);
    throw error;
  }
}

export function getSupabaseCookieClient() {
  const cookieStore = cookies();
  
  return createServerClient(
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
    const supabase = getSupabaseCookieClient();

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
    const supabase = getSupabaseCookieClient();

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
