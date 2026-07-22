'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData)),
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Invalid credentials');
    }
  }

  return (
    <div className="card w-full max-w-[420px] mx-auto mt-6 sm:mt-12">
      <h2 className="text-center sm:text-left font-semibold">SYSTEM LOGIN</h2>
      {error && <div className="alert-error">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        <div>
          <label className="block mb-1.5 text-accent text-xs font-semibold tracking-wider">USERNAME</label>
          <input type="text" name="username" className="input-field" required autoFocus placeholder="e.g. root" />
        </div>
        <div>
          <label className="block mb-1.5 text-accent text-xs font-semibold tracking-wider">PASSWORD</label>
          <input type="password" name="password" className="input-field" required placeholder="••••••••" />
        </div>
        <button type="submit" className="btn mt-3 w-full">AUTHORIZE</button>
      </form>
    </div>
  );
}
