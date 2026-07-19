import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL('/', req.url));

  const formData = await req.formData();
  const password = formData.get('password') as string;

  if (password) {
    const hash = hashPassword(password);
    await prisma.user.update({ where: { id: session.userId }, data: { passwordHash: hash } });
    await prisma.auditLog.create({ data: { userId: session.userId, action: 'CHANGE_PASSWORD' } });
  }

  return NextResponse.redirect(new URL('/settings', req.url));
}
