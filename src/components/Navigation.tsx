'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = async () => {
    await fetch('/api/logout');
    router.push('/');
    router.refresh();
  };

  useEffect(() => {
    const handleOffline = () => {
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, 30000);
    };

    const handleOnline = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    if (typeof window !== 'undefined' && !navigator.onLine) {
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

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/applications', label: 'Applications' },
    { href: '/generate', label: 'Generate' },
    { href: '/records', label: 'Records' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <div className="relative">
      {/* Mobile Hamburger Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center px-3 py-1.5 border border-border rounded text-accent hover:bg-[#1a1a1a] focus:outline-none"
        aria-label="Toggle navigation"
      >
        <span className="font-mono text-xs sm:text-sm mr-1.5">{isOpen ? '[ CLOSE ]' : '[ MENU ]'}</span>
        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
          {isOpen ? (
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          ) : (
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          )}
        </svg>
      </button>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-2 font-mono text-sm">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-2 py-1 rounded transition-colors ${
                isActive
                  ? 'text-accent font-bold bg-[#1a1a1a] border border-border'
                  : 'text-foreground hover:text-accent hover:bg-[#111]'
              }`}
            >
              [{item.label}]
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="px-2 py-1 text-error hover:bg-[#1a1a1a] rounded cursor-pointer font-mono border border-transparent hover:border-border transition-colors"
        >
          [Logout]
        </button>
      </nav>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden absolute right-0 top-full mt-2 w-56 bg-[#0f0f0f] border border-border rounded shadow-2xl z-50 p-2 flex flex-col gap-1 font-mono">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`px-3 py-2.5 rounded text-left transition-colors ${
                  isActive
                    ? 'text-accent font-bold bg-[#1a1a1a] border border-border'
                    : 'text-foreground hover:text-accent hover:bg-[#111]'
                }`}
              >
                [{item.label}]
              </Link>
            );
          })}
          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="px-3 py-2.5 text-left text-error hover:bg-[#1a1a1a] rounded font-mono transition-colors"
          >
            [Logout]
          </button>
        </div>
      )}
    </div>
  );
}
