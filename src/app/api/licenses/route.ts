import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL('/', req.url), 303);

  const formData = await req.formData();
  const action = formData.get('action');
  const id = parseInt(formData.get('id') as string, 10);

  if (!isNaN(id)) {
    try {
      if (action === 'suspend') {
        await prisma.license.update({ where: { id }, data: { status: 'Suspended' } });
        await prisma.auditLog.create({ data: { userId: session.userId, action: 'SUSPEND_LICENSE', targetId: id, targetType: 'license' } }).catch(() => {});
      } else if (action === 'revoke') {
        await prisma.license.update({ where: { id }, data: { status: 'Revoked' } });
        await prisma.auditLog.create({ data: { userId: session.userId, action: 'REVOKE_LICENSE', targetId: id, targetType: 'license' } }).catch(() => {});
      }
    } catch (e) {
      console.error('Error updating license status:', e);
    }
  }

  return NextResponse.redirect(new URL('/records', req.url), 303);
}
