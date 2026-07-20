import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt, verifyPassword } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const user = await prisma.user.findUnique({ where: { username } });

    if (user && verifyPassword(password, user.passwordHash)) {
      await prisma.auditLog.create({ data: { userId: user.id, action: 'LOGIN_SUCCESS' } });
      
      const session = await encrypt({ userId: user.id, username: user.username });
      cookies().set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    await prisma.auditLog.create({ data: { action: 'LOGIN_FAILED' } });
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error?.message || String(error) }, { status: 500 });
  }
}
