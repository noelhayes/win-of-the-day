import { createClient } from '../utils/supabase/server';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

// Lazy-load client components
const SignInForm = dynamic(() => import('../components/SignInForm'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-32 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  ),
});

const GoogleSignInButton = dynamic(() => import('../components/GoogleSignInButton'), {
  ssr: false,
});

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If the user is already logged in, send them to the feed.
  if (user && !error) {
    redirect('/feed');
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* =============================================
          Value Prop Section (Mobile-first display)
      ============================================== */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white p-12 flex flex-col justify-center relative overflow-hidden">
        {/* Subtle grid pattern & gradient overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent"></div>
        
        <div className="relative max-w-xl mx-auto">
          {/* Simplified, more scannable content */}
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-indigo-200 text-transparent bg-clip-text">
            Win of the Day
          </h1>
          <p className="text-xl mb-6 text-indigo-100 leading-relaxed">
            A daily space for reflection and connection. Share your wins, get inspired, and strengthen friendships without the constant catch-up.
            <span className="block mt-6 text-lg italic text-indigo-200 border-l-4 border-indigo-400 pl-4">
                "Friendship isn't about catching up, it's about never falling behind in the first place."
              </span>
          </p>
          
          <ul className="list-none space-y-6">
            <li className="flex items-start space-x-4 group">
              <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-indigo-500/20">
                <svg
                  className="w-7 h-7 text-indigo-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414
                      a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl text-white mb-1">Daily Reflections</h3>
                <p className="text-indigo-200 text-lg leading-relaxed">
                  Share your wins and experiences each day.
                </p>
              </div>
            </li>

            <li className="flex items-start space-x-4 group">
              <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-indigo-500/20">
                <svg
                  className="w-7 h-7 text-indigo-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2
                      c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7
                      20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0
                      019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6
                      3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0
                      11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl text-white mb-1">Connect with Others</h3>
                <p className="text-indigo-200 text-lg leading-relaxed">
                  Stay in sync with friends without endless catch-up calls.
                </p>
              </div>
            </li>

            <li className="flex items-start space-x-4 group">
              <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-indigo-500/20">
                <svg
                  className="w-7 h-7 text-indigo-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.663 17h4.673M12 3v1m6.364
                      1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828
                      9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014
                      18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl text-white mb-1">Find Inspiration</h3>
                <p className="text-indigo-200 text-lg leading-relaxed">
                  Discover new perspectives to keep you motivated.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* =============================================
          Sign In Section (Stacks below on mobile)
      ============================================== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-gradient-to-br from-slate-50 to-white">
        {/* Slightly framed container to draw attention */}
        <div className="w-full max-w-md space-y-8 bg-white/80 p-8 rounded-xl shadow-xl border border-gray-100">
          <div>
            <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-gray-900">
              Get Started
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Share your wins and stay connected.
            </p>
          </div>

          <div>
            <GoogleSignInButton />
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign in with your email</span>
            </div>
          </div>

          <SignInForm />
        </div>
      </div>
    </div>
  );
}
