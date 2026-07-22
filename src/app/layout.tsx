import './globals.css';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import Navigation from '@/components/Navigation';

export const metadata = {
  title: 'Mobawi License Portal',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en">
      <body>
        <div className="max-w-[1200px] mx-auto p-4 sm:p-6">
          <header className="border-b border-border pb-3 mb-6 flex flex-row justify-between items-center gap-3">
            <Link href={session ? "/dashboard" : "/"} className="no-underline text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-accent hover:no-underline">
              MOBAWI<span className="text-[#555]">_</span>LICENSE<span className="text-[#555]">_</span>PORTAL
            </Link>
            {session && (
              <Navigation />
            )}
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
