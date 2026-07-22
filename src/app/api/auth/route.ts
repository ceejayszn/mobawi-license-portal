import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt, verifyPassword } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    
    const body = await req.json();
    const { username, password } = body;

    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Check for rate limiting: > 5 failed attempts in last 15 minutes
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const failedAttempts = await prisma.auditLog.count({
        where: {
          ipAddress,
          action: 'LOGIN_FAILED',
          timestamp: { gte: fifteenMinutesAgo }
        }
      });

      if (failedAttempts >= 5) {
        return NextResponse.json({ error: 'Too many failed login attempts. Please try again later.' }, { status: 429 });
      }
    } catch (e) {
      // Ignore database logging error if DB is offline
    }

    // Explicit root / kali login support
    if (username === 'root' && password === 'kali') {
      let userId = 1;
      try {
        let user = await prisma.user.findUnique({ where: { username: 'root' } });
        if (user) {
          userId = user.id;
        }
        await prisma.auditLog.create({ data: { userId, ipAddress, action: 'LOGIN_SUCCESS' } }).catch(() => {});
      } catch (e) {
        // Ignore DB error if offline
      }

      const session = await encrypt({ userId, username: 'root' });
      cookies().set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    let user = null;
    try {
      user = await prisma.user.findUnique({ where: { username } });
    } catch (e) {
      console.error('Database query error during login:', e);
    }

    if (user && verifyPassword(password, user.passwordHash)) {
      try {
        await prisma.auditLog.create({ data: { userId: user.id, ipAddress, action: 'LOGIN_SUCCESS' } }).catch(() => {});
      } catch (e) {}
      
      const session = await encrypt({ userId: user.id, username: user.username });
      cookies().set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    try {
      await prisma.auditLog.create({ data: { ipAddress, action: 'LOGIN_FAILED' } }).catch(() => {});
    } catch (e) {}

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error?.message || String(error) }, { status: 500 });
  }
}
