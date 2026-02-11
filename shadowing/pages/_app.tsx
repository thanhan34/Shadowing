import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import Navigation from '../components/Navigation';

const firebaseConfig = {
  apiKey: "AIzaSyBdDDNRvAwiOz9gjQtyv5yGdjUKQ8cd7bs",
  authDomain: "pteshadowing.firebaseapp.com",
  projectId: "pteshadowing",
  storageBucket: "pteshadowing.appspot.com",
  messagingSenderId: "1030709369202",
  appId: "1:1030709369202:web:f5c029e87f836c013ba5eb"
};

export default function App({ Component, pageProps }: AppProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Only initialize Firebase if it hasn't been initialized yet
      if (!getApps().length) {
        console.log('Initializing Firebase...');
        initializeApp(firebaseConfig);
        console.log('Firebase initialized successfully');
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
    <>
      <Navigation />
      <Component {...pageProps} />
    </>
  );
}
