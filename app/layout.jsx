import './globals.css';
import { Inter } from 'next/font/google';
import { createServerClient } from '@supabase/ssr';
import ClientLayout from '../components/common/ClientLayout';
import { cookies, headers } from 'next/headers';

// Load Inter font with display: swap for better performance
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'Win of the Day',
  description: 'Share your daily wins and stay connected with friends.',
};

// Following our auth standards for session management
async function getAuthState() {
  try {
    const headersList = headers();
    const authState = headersList.get('x-auth-state');
    const userId = headersList.get('x-user-id');

    if (!authState || !userId) {
      return { session: null };
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get: () => null,
          getAll: () => {
            const cookies = {};
            cookieStore.getAll().forEach((cookie) => {
              cookies[cookie.name] = cookie.value;
            });
            return cookies;
          },
          set: () => null,
          setAll: () => null,
          remove: () => null,
          removeAll: () => null
        }
      }
    );

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Auth error in layout:', error.message);
      return { session: null };
    }

    return { session };
  } catch (error) {
    console.error('Error in getAuthState:', error.message);
    return { session: null };
  }
}

export default async function RootLayout({ children }) {
  const { session } = await getAuthState();
  
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ClientLayout 
          className={inter.className}
          session={session}
        >
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
