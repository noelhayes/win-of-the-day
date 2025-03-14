'use client';

import dynamic from 'next/dynamic';

// Lazy-load client components with loading states
const SignInForm = dynamic(() => import('../common/SignInForm'), {
  loading: () => (
    <div className="w-full h-32 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  ),
});

const GoogleSignInButton = dynamic(() => import('../common/GoogleSignInButton'), {
  loading: () => (
    <div className="w-full h-10 flex items-center justify-center">
      <div className="animate-pulse bg-gray-200 rounded-lg w-full h-full"></div>
    </div>
  ),
});

export default function AuthWrapper({ user, error }) {
  if (user && !error) {
    return null; // Will be handled by redirect in parent
  }

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-gradient-to-br from-slate-50 to-white">
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
  );
}
