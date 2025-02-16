'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';

export default function VerifyPage() {
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const supabase = createClient();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Check verification status periodically
  useEffect(() => {
    const checkVerification = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        router.push('/feed');
      }
    };

    const timer = setInterval(checkVerification, 3000);
    checkVerification();

    return () => clearInterval(timer);
  }, [router, supabase.auth]);

  const handleResendEmail = async () => {
    try {
      setIsResending(true);
      setError(null);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;
      
      setCountdown(60);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verify your email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Almost there! One last step to get started.
        </p>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="text-center">
              <div className="rounded-md bg-blue-50 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 md:flex md:justify-between">
                    <p className="text-sm text-blue-700">
                      We sent a verification link to <span className="font-medium">{email}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="prose prose-blue text-left">
                <h3 className="text-lg font-medium">Next steps:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Check your email for the verification link</li>
                  <li>Click the link to verify your account</li>
                  <li>You'll be automatically redirected to your feed</li>
                </ol>
              </div>

              <p className="text-sm text-gray-500 mt-6 mb-4">
                Didn't receive the email? Check your spam folder or try resending below.
              </p>

              {error && (
                <div className="rounded-md bg-red-50 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Button
                  onClick={handleResendEmail}
                  disabled={countdown > 0 || isResending}
                  className="w-full"
                >
                  {isResending ? (
                    <Spinner className="h-5 w-5" />
                  ) : countdown > 0 ? (
                    `Resend email (${countdown}s)`
                  ) : (
                    'Resend verification email'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
