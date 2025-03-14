'use client';

import { useEffect, useState, useRef } from 'react';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 rounded-lg bg-white shadow-lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600">{error.message}</p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

// Class manager using MutationObserver
function useClassManager() {
  useEffect(() => {
    // Remove VSCode classes immediately
    document.documentElement.classList.remove('vsc-initialized');
    document.body.classList.remove('vsc-initialized');

    // Set up observer to prevent future additions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const element = mutation.target;
          if (element.classList.contains('vsc-initialized')) {
            element.classList.remove('vsc-initialized');
          }
        }
      });
    });

    // Observe both html and body elements
    observer.observe(document.documentElement, { attributes: true });
    observer.observe(document.body, { attributes: true });

    return () => observer.disconnect();
  }, []);
}

export default function ClientLayout({ children, className, session }) {
  const [mounted, setMounted] = useState(false);
  const layoutRef = useRef(null);
  
  // Use our class manager hook
  useClassManager();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render content after hydration to prevent mismatches
  if (!mounted) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingFallback />}>
        <main 
          ref={layoutRef}
          className={`min-h-screen bg-gray-100 ${className || ''}`}
          suppressHydrationWarning
        >
          {children}
        </main>
      </Suspense>
    </ErrorBoundary>
  );
}
