import { createClient } from '../utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

// Import SignInForm as a client component
const SignInForm = dynamic(() => import('../components/SignInForm'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-32 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  ),
});

export default async function Home() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (user && !error) {
    redirect('/feed');
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - App description */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white p-12 flex-col justify-center relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/50 to-transparent"></div>
        
        <div className="relative max-w-xl mx-auto">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-indigo-200 text-transparent bg-clip-text">
              Win of the Day
            </h1>
            <p className="text-xl mb-8 text-indigo-100 leading-relaxed">
              Your daily space for reflection and connection. Share your wins, inspire others, and maintain meaningful connections through daily updates.
              <span className="block mt-6 text-lg italic text-indigo-200 border-l-4 border-indigo-400 pl-4">
                "Friendship isn't about catching up, it's about never falling behind in the first place."
                <span className="block mt-2 text-base font-medium">- Noel Hayes</span>
              </span>
            </p>
          </div>
          
          <div className="space-y-8">
            <div className="flex items-start space-x-6 group">
              <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-indigo-500/20">
                <svg className="w-7 h-7 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl text-white mb-2">Daily Reflections</h3>
                <p className="text-indigo-200 text-lg leading-relaxed">Share your daily wins and experiences</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-6 group">
              <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-indigo-500/20">
                <svg className="w-7 h-7 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl text-white mb-2">Connect with Others</h3>
                <p className="text-indigo-200 text-lg leading-relaxed">Build meaningful connections with like-minded people</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-6 group">
              <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-indigo-500/20">
                <svg className="w-7 h-7 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl text-white mb-2">Find Inspiration</h3>
                <p className="text-indigo-200 text-lg leading-relaxed">Discover new perspectives and ideas daily</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Sign In Form */}
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
