import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import argon2 from 'argon2';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL('/', req.url));

  const formData = await req.formData();
  const password = formData.get('password') as string;

  if (password) {
    const hash = await argon2.hash(password);
    await prisma.user.update({ where: { id: session.userId }, data: { passwordHash: hash } });
    await prisma.auditLog.create({ data: { userId: session.userId, action: 'CHANGE_PASSWORD' } });
  }

  return NextResponse.redirect(new URL('/settings', req.url));
}
