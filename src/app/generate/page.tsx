'use client';

import { useState, useEffect } from 'react';

function CountdownTimer({ expiryDate }: { expiryDate: string }) {
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

  if (timeLeft.isExpired) {
    return <span className="px-2.5 py-1 rounded text-xs font-bold bg-error/20 text-error border border-error/40 animate-pulse">EXPIRED</span>;
  }

  return (
    <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-bold text-accent">
      <span className="bg-accent/10 px-2 py-1 rounded border border-accent/20">
        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
        {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
      </span>
      <span className="text-xs text-foreground/70 font-sans">remaining</span>
    </div>
  );
}

export default function GeneratePage() {
  const [apps, setApps] = useState<{id: number, name: string, platform: string}[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('30 Days');
  const [customValue, setCustomValue] = useState('100');

  useEffect(() => {
    fetch('/api/applications/list').then(r => r.json()).then(setApps);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setResult(null);
    
    const formData = new FormData(e.currentTarget);
    const body: any = Object.fromEntries(formData);

    if (selectedType === 'Custom Hours') {
      body.customHours = customValue;
    } else if (selectedType === 'Custom Days') {
      body.customDays = customValue;
    }
    
    const res = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      setResult(await res.json());
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to generate license');
    }
  }

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (result?.licenseBlob) {
      navigator.clipboard.writeText(result.licenseBlob);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <div className="card flex-1">
        <h2 className="font-semibold text-lg sm:text-xl">GENERATE OFFLINE LICENSE</h2>
        {error && <div className="alert-error mt-2">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div>
            <label className="block text-accent mb-1 text-xs font-semibold">Application</label>
            <select name="applicationId" className="input-field" required>
              <option value="">-- Select Application --</option>
              {apps.map(app => (
                <option key={app.id} value={app.id}>{app.name} ({app.platform})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-accent mb-1 text-xs font-semibold">Device Fingerprint (SHA-256)</label>
            <input type="text" name="deviceFingerprint" className="input-field" required placeholder="e.g. 5e884898da2..." />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-accent mb-1 text-xs font-semibold">User / Client Name (Optional)</label>
              <input type="text" name="clientName" className="input-field" placeholder="e.g. John Doe / Felix" />
            </div>
            <div>
              <label className="block text-accent mb-1 text-xs font-semibold">Phone Number (Optional)</label>
              <input type="tel" name="clientPhone" className="input-field" placeholder="e.g. +1 234 567 8900" />
            </div>
          </div>

          <div>
            <label className="block text-accent mb-1 text-xs font-semibold">Notes / Device Info (Optional)</label>
            <textarea name="notes" rows={2} className="input-field resize-none" placeholder="e.g. Assigned to POS terminal 2 in Main Branch" />
          </div>

          <div>
            <label className="block text-accent mb-1 text-xs font-semibold">Duration Preset</label>
            <select
              name="type"
              className="input-field"
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
            >
              <option value="1 Hour">1 Hour</option>
              <option value="24 Hours">24 Hours</option>
              <option value="7 Days">7 Days</option>
              <option value="30 Days">30 Days</option>
              <option value="90 Days">90 Days</option>
              <option value="180 Days">180 Days</option>
              <option value="365 Days">365 Days</option>
              <option value="Lifetime">Lifetime</option>
              <option value="Custom Hours">⚡ Custom Hours (e.g. 100 Hours)</option>
              <option value="Custom Days">📅 Custom Days (e.g. 45 Days)</option>
            </select>
          </div>

          {(selectedType === 'Custom Hours' || selectedType === 'Custom Days') && (
            <div className="p-3 rounded bg-accent/5 border border-accent/20 flex flex-col gap-2">
              <label className="block text-accent text-xs font-semibold">
                Enter Custom Number of {selectedType === 'Custom Hours' ? 'Hours' : 'Days'}
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={customValue}
                  onChange={e => setCustomValue(e.target.value)}
                  className="input-field max-w-[140px]"
                  required
                />
                <span className="text-xs text-foreground/80 font-semibold">
                  {selectedType === 'Custom Hours' ? 'Hours' : 'Days'}
                </span>
              </div>
            </div>
          )}

          <button type="submit" className="btn mt-2 w-full">GENERATE LICENSE</button>
        </form>
      </div>

      {result && (
        <div className="card flex-1 border-success/30">
          <h2 className="text-success font-semibold text-lg sm:text-xl">GENERATED LICENSE DETAILS</h2>
          
          {result.expiryDate && (
            <div className="mt-3 p-3 rounded-lg bg-black/40 border border-border">
              <label className="block text-accent text-xs font-semibold mb-1">Time Remaining / Status</label>
              <CountdownTimer expiryDate={result.expiryDate} />
            </div>
          )}

          <div className="mt-4">
            <label className="block text-accent text-xs font-semibold">Activation Code</label>
            <div className="mono-block text-success text-lg sm:text-2xl font-bold tracking-wider">{result.humanCode}</div>
          </div>

          {(result.clientName || result.clientPhone || result.notes) && (
            <div className="mt-4 p-3 rounded bg-accent/5 border border-border text-xs space-y-1">
              {result.clientName && <div><span className="font-semibold text-accent">Client Name:</span> {result.clientName}</div>}
              {result.clientPhone && <div><span className="font-semibold text-accent">Phone:</span> {result.clientPhone}</div>}
              {result.notes && <div><span className="font-semibold text-accent">Notes:</span> {result.notes}</div>}
            </div>
          )}

          <div className="mt-5">
            <label className="block text-accent text-xs font-semibold">Offline License Blob (Base64 JSON)</label>
            <div className="mono-block text-xs max-h-48 overflow-y-auto break-all">{result.licenseBlob}</div>
            <button 
              onClick={handleCopy} 
              className={`btn mt-3 text-xs w-full sm:w-auto ${copied ? 'border-success text-success' : ''}`}
            >
              {copied ? '✓ COPIED TO CLIPBOARD' : 'COPY BLOB'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
