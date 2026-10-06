import { ClerkProvider } from "@clerk/nextjs";
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import Navigation from '../components/Navigation';
import AccessGate from '../components/AccessGate';
import NotificationProvider from '../components/notifications/NotificationProvider';
import { firebaseConfig } from '../lib/firebaseConfig';


export default function App({ Component, pageProps }: AppProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Only initialize Firebase if it hasn't been initialized yet
      if (!getApps().length) {
        initializeApp(firebaseConfig);
      }
    } catch (err) {
      console.error('Error initializing Firebase:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize Firebase');
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <div className="text-red-500 text-xl mb-4">Error initializing app:</div>
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <ClerkProvider {...pageProps} signInUrl="/sign-in" signUpUrl="/sign-up" signInFallbackRedirectUrl="/pending-approval" signUpFallbackRedirectUrl="/pending-approval">
      <Navigation />
      <NotificationProvider />
      <AccessGate><Component {...pageProps} /></AccessGate>
    </ClerkProvider>
  );
}