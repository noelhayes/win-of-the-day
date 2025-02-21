'use client';

import { Navbar } from '../../components';
import { createClient } from '../../utils/supabase/client';
import { useEffect, useState } from 'react';

export default function AuthenticatedLayout({ children }) {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 pt-16">
        {children}
      </main>
    </div>
  );
}
