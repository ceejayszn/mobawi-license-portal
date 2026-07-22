import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL('/', req.url), 303);

  const formData = await req.formData();
  const password = formData.get('password') as string;

  if (password && password.trim().length >= 4) {
    try {
      const hash = hashPassword(password.trim());
      await prisma.user.upsert({
        where: { id: session.userId || 1 },
        update: { passwordHash: hash },
        create: { username: session.username || 'root', passwordHash: hash },
      });
      await prisma.auditLog.create({ data: { userId: session.userId || 1, action: 'CHANGE_PASSWORD' } }).catch(() => {});
    } catch (e) {
      console.error('Failed to change password:', e);
    }
  }

  return NextResponse.redirect(new URL('/settings', req.url), 303);
}
