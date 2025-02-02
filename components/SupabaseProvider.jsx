// components/SupabaseProvider.jsx
'use client';

import { useState } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';

export default function SupabaseProvider({ children, initialSession }) {
  const [supabaseClient] = useState(() => createPagesBrowserClient());
  
  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  );
}
