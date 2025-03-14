'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// Lazy-load client components with loading states
const SignInForm = dynamic(() => import('../common/SignInForm'), {
  loading: () => <AuthLoadingState />,
  ssr: false, // Prevent SSR to avoid client module errors
});

const GoogleSignInButton = dynamic(() => import('../common/GoogleSignInButton'), {
  loading: () => <AuthLoadingState small />,
  ssr: false, // Prevent SSR to avoid client module errors
});

// Consistent loading state component
function AuthLoadingState({ small }) {
  return (
    <div className={`w-full ${small ? 'h-10' : 'h-32'} flex items-center justify-center`}>
      <div 
        className={
          small 
            ? "animate-pulse bg-gray-200 rounded-lg w-full h-full"
            : "animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"
        }
      />
    </div>
  );
}

export default function AuthWrapper({ session, error: initialError }) {
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(initialError);
  const router = useRouter();

  useEffect(() => {
    // Handle session state
    if (session?.user?.id) {
      router.push('/feed');
      return;
    }

    // Add a small delay to ensure hydration is complete
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [session, router]);

  useEffect(() => {
    if (initialError) {
      setAuthError(initialError);
      console.error('Auth error:', initialError);
    }
  }, [initialError]);

  if (isLoading) {
    return (
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-gradient-to-br from-slate-50 to-white">
        <AuthLoadingState />
      </div>
    );
  }

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-gradient-to-br from-slate-50 to-white">
      <div className="w-full max-w-md space-y-8 bg-white/80 p-8 rounded-xl shadow-xl border border-gray-100">
        {authError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <p className="text-sm text-red-700">
              There was an error with authentication. Please try again.
            </p>
          </div>
        )}
        
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
