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
      window.location.href = 'https://watchbutdonotlearn.github.io/';
    }
  }

  return (
    <div className="card max-w-[400px] mx-auto mt-10">
      <h2>SYSTEM LOGIN</h2>
      {error && <div className="alert-error">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1 text-accent">USERNAME</label>
          <input type="text" name="username" className="input-field" required autoFocus />
        </div>
        <div>
          <label className="block mb-1 text-accent">PASSWORD</label>
          <input type="password" name="password" className="input-field" required />
        </div>
        <button type="submit" className="btn mt-2">AUTHORIZE</button>
      </form>
    </div>
  );
}
