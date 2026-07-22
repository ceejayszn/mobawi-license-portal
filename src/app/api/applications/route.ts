import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL('/', req.url));

  const formData = await req.formData();
  const action = formData.get('action');

  if (action === 'create') {
    const name = (formData.get('name') as string || '').trim();
    const packageName = (formData.get('packageName') as string || '').trim();
    const platform = (formData.get('platform') as string || '').trim();

    if (name && packageName && platform) {
      try {
        const app = await prisma.application.create({
          data: { name, packageName, platform }
        });
        await prisma.auditLog.create({ data: { userId: session.userId, action: 'CREATE_APPLICATION', targetId: app.id, targetType: 'application' } }).catch(() => {});
      } catch (e) {
        console.error('Error creating application:', e);
      }
    }
  } else if (action === 'delete') {
    const id = parseInt(formData.get('id') as string, 10);
    if (!isNaN(id)) {
      try {
        await prisma.application.delete({ where: { id } });
        await prisma.auditLog.create({ data: { userId: session.userId, action: 'DELETE_APPLICATION', targetId: id, targetType: 'application' } }).catch(() => {});
      } catch (e) {
        console.error('Error deleting application:', e);
      }
    }
  }

  return NextResponse.redirect(new URL('/applications', req.url));
}
