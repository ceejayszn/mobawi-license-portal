'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function Navigation() {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = async () => {
    // Perform an immediate logout to the API
    await fetch('/api/logout');
    // Push back to login
    router.push('/');
    router.refresh();
  };

  useEffect(() => {
    const handleOffline = () => {
      // Start a 30-second timer when wifi drops
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, 30000);
    };

    const handleOnline = () => {
      // Clear the timer if wifi comes back before 30 seconds
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // If they load the page already offline, start the timer immediately
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <nav className="flex gap-4">
      <Link href="/dashboard" className="hover:text-accent">[ Dashboard ]</Link>
      <Link href="/applications" className="hover:text-accent">[ Applications ]</Link>
      <Link href="/generate" className="hover:text-accent">[ Generate ]</Link>
      <Link href="/records" className="hover:text-accent">[ Records ]</Link>
      <Link href="/settings" className="hover:text-accent">[ Settings ]</Link>
      <button onClick={handleLogout} className="hover:text-accent cursor-pointer border-none bg-transparent p-0 m-0 font-inherit font-mono">
        [ Logout ]
      </button>
    </nav>
  );
}
