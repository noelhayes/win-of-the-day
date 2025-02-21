/**
 * @typedef {import('@supabase/supabase-js').User} User
 * @typedef {import('@supabase/supabase-js').Session} Session
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { authLogger as logger } from './logger';

class AuthError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.originalError = originalError;
  }
}

function getSupabaseCookieClient() {
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
    throw new AuthError(
      'Failed to update profile',
      'PROFILE_UPDATE_FAILED',
      error
    );
  }
}

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
    throw new AuthError(
      'Failed to get profile',
      'PROFILE_RETRIEVAL_FAILED',
      error
    );
  }
}
