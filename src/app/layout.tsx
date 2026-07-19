import './globals.css';
import Link from 'next/link';
import { getSession } from '@/lib/auth';

export const metadata = {
  title: 'Mobawi License Portal',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en">
      <body>
        <div className="max-w-[1200px] mx-auto p-5">
          <header className="border-b border-border pb-2.5 mb-5 flex justify-between items-center">
            <div className="text-2xl text-accent">
              MOBAWI<span className="text-[#555]">_</span>LICENSE<span className="text-[#555]">_</span>PORTAL
            </div>
            {session && (
              <nav className="flex gap-4">
                <Link href="/dashboard" className="hover:text-accent">[ Dashboard ]</Link>
                <Link href="/applications" className="hover:text-accent">[ Applications ]</Link>
                <Link href="/generate" className="hover:text-accent">[ Generate ]</Link>
                <Link href="/records" className="hover:text-accent">[ Records ]</Link>
                <Link href="/settings" className="hover:text-accent">[ Settings ]</Link>
                <Link href="/api/logout" className="hover:text-accent">[ Logout ]</Link>
              </nav>
            )}
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
