import './globals.css';
import { Inter } from 'next/font/google';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Win of the Day',
  description: 'Share your daily wins and stay connected with friends.',
};

export default async function RootLayout({ children }) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Check if user needs to complete onboarding
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    const headersList = headers()
    const pathname = headersList.get('x-pathname') || '/'
    
    if (!profile?.username && pathname !== '/onboarding') {
      redirect('/onboarding')
    }
  }

  return (
    <html lang="en">
      <body className={`min-h-screen bg-gray-100 ${inter.className}`}>
        {children}
      </body>
    </html>
  );
}
