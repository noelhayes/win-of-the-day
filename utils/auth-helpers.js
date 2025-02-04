import { createClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function ensureProfile(user) {
  console.log('ensureProfile called with user:', {
    id: user.id,
    email: user.email,
    metadata: user.user_metadata,
    identities: user.identities
  });
  
  // Use service_role key for admin access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Check if profile exists
  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select()
    .eq('id', user.id)
    .single();

  console.log('Profile check result:', { existingProfile, profileError });

  if (existingProfile) {
    console.log('Profile already exists, returning');
    return;
  }

  // Get user details
  let name;
  let email = user.email;

  // Try to get name from different sources
  if (user.identities && user.identities.length > 0) {
    // OAuth user
    const identity = user.identities[0];
    name = identity.identity_data?.full_name || 
           identity.identity_data?.name ||
           email.split('@')[0];
    console.log('Got name from OAuth:', name);
  } else {
    // Regular user
    name = user.user_metadata?.name || 
           user.raw_user_meta_data?.name || 
           email.split('@')[0];
    console.log('Got name from metadata:', name);
  }

  const profile = {
    id: user.id,
    name,
    email,
    created_at: new Date().toISOString(),
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture
  };

  console.log('Attempting to create profile with:', profile);

  // Create profile if it doesn't exist
  const { error: insertError } = await supabase
    .from('profiles')
    .insert([profile]);

  if (insertError) {
    console.error('Error creating profile:', insertError);
    console.error('Error details:', {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint
    });
    throw insertError;
  }

  console.log('Profile created successfully');
}
