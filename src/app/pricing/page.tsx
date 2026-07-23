'use client';

import { useState, useEffect } from 'react';

export default function PricingPage() {
  const [apps, setApps] = useState<{ id: number; name: string; platform: string }[]>([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [clientName, setClientName] = useState('');
  const [currency, setCurrency] = useState('$');
  
  // Pricing inputs
  const [pricingModel, setPricingModel] = useState('perpetual'); // 'subscription' | 'perpetual' | 'usage'
  const [basePrice, setBasePrice] = useState(50);
  const [quantity, setQuantity] = useState(1);
  const [durationValue, setDurationValue] = useState(12);
  const [durationUnit, setDurationUnit] = useState('months'); // 'hours' | 'days' | 'months' | 'years'
  
  // Addons
  const [hasOfflineLock, setHasOfflineLock] = useState(true);
  const [hasPrioritySupport, setHasPrioritySupport] = useState(false);
  const [hasWhiteLabel, setHasWhiteLabel] = useState(false);
  const [hasKeyRegen, setHasKeyRegen] = useState(true);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/applications/list')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setApps(data);
          if (data.length > 0) setSelectedApp(data[0].name);
        }
      })
      .catch(() => {});
  }, []);

  // Calculation Logic
  const calcBaseTotal = () => {
    const p = Math.max(0, Number(basePrice) || 0);
    const q = Math.max(1, Number(quantity) || 1);
    const d = Math.max(1, Number(durationValue) || 1);

    if (pricingModel === 'subscription') {
      // Base price per device per month
      let monthFactor = d;
      if (durationUnit === 'hours') monthFactor = d / (24 * 30);
      if (durationUnit === 'days') monthFactor = d / 30;
      if (durationUnit === 'years') monthFactor = d * 12;
      return p * q * monthFactor;
    } else if (pricingModel === 'usage') {
      // Base price per hour/day per device
      return p * q * d;
    } else {
      // Perpetual / One-time key
      return p * q;
    }
  };

  const rawTotal = calcBaseTotal();

  // Volume discounts
  let volumeDiscountPct = 0;
  if (quantity >= 20) volumeDiscountPct = 25;
  else if (quantity >= 10) volumeDiscountPct = 15;
  else if (quantity >= 5) volumeDiscountPct = 10;

  const discountAmount = (rawTotal * volumeDiscountPct) / 100;
  
  // Addon charges
  const offlineFee = hasOfflineLock ? rawTotal * 0.15 : 0; // 15% surcharge for offline hardware crypto key
  const prioritySupportFee = hasPrioritySupport ? 30 * quantity : 0;
  const whiteLabelFee = hasWhiteLabel ? 75 : 0;
  const keyRegenFee = hasKeyRegen ? 15 * quantity : 0;

  const finalTotal = Math.max(0, rawTotal - discountAmount + offlineFee + prioritySupportFee + whiteLabelFee + keyRegenFee);
  const monthlyEquivalent = pricingModel === 'subscription' && durationUnit === 'years' ? finalTotal / 12 : finalTotal;

  // Quote generator string
  const generateQuoteText = () => {
    const lines = [
      `=======================================`,
      ` SOFTWARE LICENSE QUOTE & MONETIZATION `,
      `=======================================`,
      `Client: ${clientName || 'Valued Customer'}`,
      `Application: ${selectedApp || 'Mobawi Application'}`,
      `Pricing Model: ${pricingModel.toUpperCase()}`,
      `Devices / Licenses: ${quantity}`,
      `Duration: ${durationValue} ${durationUnit}`,
      `---------------------------------------`,
      `Base Price: ${currency}${rawTotal.toFixed(2)}`,
      volumeDiscountPct > 0 ? `Volume Discount (${volumeDiscountPct}%): -${currency}${discountAmount.toFixed(2)}` : null,
      hasOfflineLock ? `Offline Hardware Crypto Lock: +${currency}${offlineFee.toFixed(2)}` : null,
      hasPrioritySupport ? `Priority 24/7 Support: +${currency}${prioritySupportFee.toFixed(2)}` : null,
      hasWhiteLabel ? `White-label Branding: +${currency}${whiteLabelFee.toFixed(2)}` : null,
      hasKeyRegen ? `Key Regeneration Guarantee: +${currency}${keyRegenFee.toFixed(2)}` : null,
      `---------------------------------------`,
      `TOTAL ESTIMATED AMOUNT: ${currency}${finalTotal.toFixed(2)}`,
      `=======================================`,
    ].filter(Boolean);
    return lines.join('\n');
  };

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(generateQuoteText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
        <div>
          <h2 className="font-semibold text-lg sm:text-xl text-accent">SOFTWARE MONETIZATION & PRICING CALCULATOR</h2>
          <p className="text-xs text-foreground/70">Calculate software license prices, generate custom client quotes, and project revenues.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-accent">Currency:</label>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="input-field py-1 px-2 text-xs font-mono"
          >
            <option value="$">USD ($)</option>
            <option value="€">EUR (€)</option>
            <option value="£">GBP (£)</option>
            <option value="KSh ">KES (KSh)</option>
            <option value="₦">NGN (₦)</option>
            <option value="R ">ZAR (R)</option>
            <option value="₹">INR (₹)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calculator Configuration Card */}
        <div className="card flex-[1.2] space-y-4">
          <h3 className="font-semibold text-base text-foreground border-b border-border pb-2">1. LICENSE & CLIENT CONFIGURATION</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-accent mb-1 text-xs font-semibold">Target Application</label>
              <select
                value={selectedApp}
                onChange={e => setSelectedApp(e.target.value)}
                className="input-field"
              >
                {apps.length === 0 && <option value="Mobawi App">Mobawi App</option>}
                {apps.map(app => (
                  <option key={app.id} value={app.name}>{app.name} ({app.platform})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-accent mb-1 text-xs font-semibold">Client Name / Business</label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="e.g. Acme Corp / Felix"
                className="input-field"
              />
            </div>
          </div>

          <h3 className="font-semibold text-base text-foreground border-b border-border pb-2 pt-2">2. PRICING MODEL & UNITS</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPricingModel('perpetual')}
              className={`p-3 rounded border text-left text-xs transition-colors ${
                pricingModel === 'perpetual'
                  ? 'border-accent bg-accent/10 text-accent font-bold'
                  : 'border-border hover:bg-[#181818] text-foreground/80'
              }`}
            >
              <div className="font-bold text-sm">One-Time / Lifetime</div>
              <div className="text-[11px] opacity-80 mt-1">Single fee for permanent hardware license key.</div>
            </button>

            <button
              type="button"
              onClick={() => setPricingModel('subscription')}
              className={`p-3 rounded border text-left text-xs transition-colors ${
                pricingModel === 'subscription'
                  ? 'border-accent bg-accent/10 text-accent font-bold'
                  : 'border-border hover:bg-[#181818] text-foreground/80'
              }`}
            >
              <div className="font-bold text-sm">Recurring Subscription</div>
              <div className="text-[11px] opacity-80 mt-1">Charged per month/year per device.</div>
            </button>

            <button
              type="button"
              onClick={() => setPricingModel('usage')}
              className={`p-3 rounded border text-left text-xs transition-colors ${
                pricingModel === 'usage'
                  ? 'border-accent bg-accent/10 text-accent font-bold'
                  : 'border-border hover:bg-[#181818] text-foreground/80'
              }`}
            >
              <div className="font-bold text-sm">Time / Hourly Rental</div>
              <div className="text-[11px] opacity-80 mt-1">Short-term keys (e.g. 100 Hours or 45 Days).</div>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-accent mb-1 text-xs font-semibold">
                Base Unit Rate ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={basePrice}
                onChange={e => setBasePrice(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-accent mb-1 text-xs font-semibold">Number of Devices / Seats</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-accent mb-1 text-xs font-semibold">Duration Value & Unit</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={durationValue}
                  onChange={e => setDurationValue(Number(e.target.value))}
                  className="input-field w-1/2"
                />
                <select
                  value={durationUnit}
                  onChange={e => setDurationUnit(e.target.value)}
                  className="input-field w-1/2 text-xs"
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>
          </div>

          <h3 className="font-semibold text-base text-foreground border-b border-border pb-2 pt-2">3. SECURITY & SERVICE ADD-ONS</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center gap-2 p-2.5 rounded border border-border bg-[#121212] cursor-pointer hover:bg-[#1a1a1a]">
              <input
                type="checkbox"
                checked={hasOfflineLock}
                onChange={e => setHasOfflineLock(e.target.checked)}
                className="accent-accent"
              />
              <div>
                <div className="font-semibold text-accent">Offline Ed25519 Hardware Lock (+15%)</div>
                <div className="text-[11px] text-foreground/60">Forge-proof cryptographic offline validation.</div>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded border border-border bg-[#121212] cursor-pointer hover:bg-[#1a1a1a]">
              <input
                type="checkbox"
                checked={hasPrioritySupport}
                onChange={e => setHasPrioritySupport(e.target.checked)}
                className="accent-accent"
              />
              <div>
                <div className="font-semibold text-accent">Priority 24/7 SLA Support (+{currency}30/dev)</div>
                <div className="text-[11px] text-foreground/60">Guaranteed uptime & fast emergency assistance.</div>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded border border-border bg-[#121212] cursor-pointer hover:bg-[#1a1a1a]">
              <input
                type="checkbox"
                checked={hasWhiteLabel}
                onChange={e => setHasWhiteLabel(e.target.checked)}
                className="accent-accent"
              />
              <div>
                <div className="font-semibold text-accent">White-label Branding (+{currency}75 flat)</div>
                <div className="text-[11px] text-foreground/60">Custom company logo and license screens.</div>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded border border-border bg-[#121212] cursor-pointer hover:bg-[#1a1a1a]">
              <input
                type="checkbox"
                checked={hasKeyRegen}
                onChange={e => setHasKeyRegen(e.target.checked)}
                className="accent-accent"
              />
              <div>
                <div className="font-semibold text-accent">Free Key Re-issuance (+{currency}15/dev)</div>
                <div className="text-[11px] text-foreground/60">Free replacement if device hardware breaks.</div>
              </div>
            </label>
          </div>
        </div>

        {/* Price Summary & Quote Generator Card */}
        <div className="card flex-1 border-accent/40 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-base text-accent mb-4 border-b border-border pb-2">ESTIMATED PRICE BREAKDOWN</h3>

            <div className="p-4 rounded-lg bg-black/50 border border-accent/30 text-center mb-5">
              <div className="text-xs text-foreground/70 uppercase tracking-wider font-semibold">Total Quoted Amount</div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-success mt-1">
                {currency}{finalTotal.toFixed(2)}
              </div>
              {quantity > 1 && (
                <div className="text-xs text-accent mt-1">
                  ({currency}{(finalTotal / quantity).toFixed(2)} per device)
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground/70">Subtotal ({quantity} device{quantity > 1 ? 's' : ''}):</span>
                <span className="font-semibold">{currency}{rawTotal.toFixed(2)}</span>
              </div>

              {volumeDiscountPct > 0 && (
                <div className="flex justify-between py-1 border-b border-border/50 text-success">
                  <span>Volume Discount ({volumeDiscountPct}% off):</span>
                  <span>-{currency}{discountAmount.toFixed(2)}</span>
                </div>
              )}

              {hasOfflineLock && (
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-foreground/70">Offline Crypto Surcharge (+15%):</span>
                  <span>+{currency}{offlineFee.toFixed(2)}</span>
                </div>
              )}

              {hasPrioritySupport && (
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-foreground/70">Priority Support SLA:</span>
                  <span>+{currency}{prioritySupportFee.toFixed(2)}</span>
                </div>
              )}

              {hasWhiteLabel && (
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-foreground/70">White-label Fee:</span>
                  <span>+{currency}{whiteLabelFee.toFixed(2)}</span>
                </div>
              )}

              {hasKeyRegen && (
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-foreground/70">Key Regeneration Guarantee:</span>
                  <span>+{currency}{keyRegenFee.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Generated Quote Box */}
            <div className="mt-6">
              <label className="block text-accent text-xs font-semibold mb-1">Formatted Quote Summary</label>
              <pre className="mono-block text-[11px] p-3 max-h-52 overflow-y-auto whitespace-pre-wrap select-all">
                {generateQuoteText()}
              </pre>
            </div>
          </div>

          <button
            onClick={handleCopyQuote}
            className={`btn mt-4 w-full text-xs font-mono py-2.5 ${copied ? 'border-success text-success' : ''}`}
          >
            {copied ? '✓ QUOTE COPIED TO CLIPBOARD' : '📋 COPY CLIENT QUOTE'}
          </button>
        </div>
      </div>
    </div>
  );
}
