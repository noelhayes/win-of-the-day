import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authLogger as logger } from '../../../../utils/logger';

// Password validation rules
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

function validatePassword(password) {
  const errors = [];
  
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }
  
  if (!PASSWORD_REGEX.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  }
  
  return errors;
}

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

    const { email, password, name } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Validate password
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { error: passwordErrors.join('. ') },
        { status: 400 }
      );
    }

    logger.info('Creating new user', { 
      email,
      hasName: !!name,
      env: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    });

    // Create the user in Supabase Auth with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name || email.split('@')[0], // This will trigger our database trigger
        },
      },
    });

    if (authError) {
      logger.error('Auth error creating user', { 
        error: authError.message,
        code: authError.status
      });
      
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Wait a moment to ensure the database trigger has completed
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify the profile was created
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      logger.error('Database error checking profile', {
        error: profileError.message,
        code: profileError.code,
        userId: authData.user.id
      });

      return NextResponse.json(
        { error: 'Database error saving new user' },
        { status: 500 }
      );
    }

    logger.info('User created successfully', {
      userId: authData.user.id,
      hasProfile: !!profile
    });

    // Redirect to verification page with email
    const verifyUrl = new URL('/verify', getSiteUrl());
    verifyUrl.searchParams.set('email', email);

    return NextResponse.json(
      { 
        message: 'User created successfully',
        redirectTo: verifyUrl.toString()
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Unexpected error in signup', { error: error.message });
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
