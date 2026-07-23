'use client';

import { useState, useEffect } from 'react';

export default function LicenseCountdown({ expiryDate, status }: { expiryDate: string; status: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const target = new Date(expiryDate).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiryDate]);

  if (status === 'Revoked' || status === 'Suspended') {
    return (
      <span className="text-xs text-foreground/60">
        {new Date(expiryDate).toLocaleDateString()}
      </span>
    );
  }

  if (timeLeft.isExpired) {
    return (
      <div className="flex flex-col">
        <span className="text-xs text-foreground/60">{new Date(expiryDate).toLocaleDateString()}</span>
        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-error/20 text-error border border-error/30 w-fit">
          EXPIRED
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="text-xs text-foreground/80">{new Date(expiryDate).toLocaleDateString()}</span>
      <span className="font-mono text-xs font-semibold text-accent mt-0.5">
        ⏳ {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
        {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
      </span>
    </div>
  );
}
