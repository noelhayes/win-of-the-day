/**
 * @typedef {import('@supabase/supabase-js').User} User
 * @typedef {import('@supabase/supabase-js').Session} Session
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { authLogger as logger } from './logger';

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
 * Gets the base URL for the current environment
 */
const getBaseUrl = () => {
  return process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_SITE_URL;
};

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
