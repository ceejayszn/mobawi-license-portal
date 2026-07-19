'use client';

import { useState, useEffect } from 'react';

export default function GeneratePage() {
  const [apps, setApps] = useState<{id: number, name: string, platform: string}[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/applications/list').then(r => r.json()).then(setApps);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setResult(null);
    
    const formData = new FormData(e.currentTarget);
    const res = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData)),
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      setResult(await res.json());
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to generate');
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <div className="card flex-1">
        <h2>GENERATE OFFLINE LICENSE</h2>
        {error && <div className="alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-accent mb-1">Application</label>
            <select name="applicationId" className="input-field" required>
              <option value="">-- Select Application --</option>
              {apps.map(app => (
                <option key={app.id} value={app.id}>{app.name} ({app.platform})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-accent mb-1">Device Fingerprint (SHA-256)</label>
            <input type="text" name="deviceFingerprint" className="input-field" required placeholder="e.g. 5e884898da2..." />
          </div>
          <div>
            <label className="block text-accent mb-1">Duration</label>
            <select name="type" className="input-field">
              <option value="1 Hour">1 Hour</option>
              <option value="24 Hours">24 Hours</option>
              <option value="7 Days">7 Days</option>
              <option value="30 Days" defaultValue="30 Days">30 Days</option>
              <option value="90 Days">90 Days</option>
              <option value="180 Days">180 Days</option>
              <option value="365 Days">365 Days</option>
              <option value="Lifetime">Lifetime</option>
            </select>
          </div>
          <button type="submit" className="btn mt-2">GENERATE LICENSE</button>
        </form>
      </div>

      {result && (
        <div className="card flex-1">
          <h2 className="text-success">GENERATED LICENSE DETAILS</h2>
          <div className="mt-4">
            <label className="block text-accent">Activation Code</label>
            <div className="mono-block text-success text-2xl">{result.humanCode}</div>
          </div>
          <div className="mt-5">
            <label className="block text-accent">Offline License Blob (Base64 JSON)</label>
            <div className="mono-block">{result.licenseBlob}</div>
            <button 
              onClick={() => { navigator.clipboard.writeText(result.licenseBlob); alert('Copied!'); }} 
              className="btn mt-2 text-xs"
            >
              COPY BLOB
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
