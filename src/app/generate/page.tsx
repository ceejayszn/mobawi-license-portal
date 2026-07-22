'use client';

import { useState, useEffect } from 'react';

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
          <div className="mt-4">
            <label className="block text-accent text-xs font-semibold">Activation Code</label>
            <div className="mono-block text-success text-lg sm:text-2xl font-bold tracking-wider">{result.humanCode}</div>
          </div>
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
