'use client';

import { useState } from 'react';

export default function ViewBlobModal({
  code,
  blob,
  appName,
  device
}: {
  code: string;
  blob: string;
  appName: string;
  device: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(blob);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-2 py-0.5 text-xs rounded border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent font-mono transition-colors"
        title="View & Copy Base64 Offline License Blob"
      >
        🔑 View Blob
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="card max-w-lg w-full border-accent/40 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h3 className="font-semibold text-base text-accent">OFFLINE LICENSE BLOB</h3>
                <p className="text-xs text-foreground/70">{appName} • {code}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-foreground/60 hover:text-foreground text-lg font-bold px-2 py-0.5 rounded"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-accent text-xs font-semibold mb-1">Activation Code</label>
              <div className="mono-block text-success text-base font-bold tracking-wider">{code}</div>
            </div>

            <div>
              <label className="block text-accent text-xs font-semibold mb-1">Device Fingerprint</label>
              <div className="mono-block text-xs text-foreground/80 break-all">{device}</div>
            </div>

            <div>
              <label className="block text-accent text-xs font-semibold mb-1">Base64 Offline License Blob</label>
              <div className="mono-block text-[11px] max-h-40 overflow-y-auto break-all select-all font-mono">
                {blob}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 rounded border border-border text-xs text-foreground/80 hover:bg-[#222]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className={`btn text-xs px-4 py-1.5 ${copied ? 'border-success text-success' : ''}`}
              >
                {copied ? '✓ COPIED TO CLIPBOARD' : '📋 COPY BLOB'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
