import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL('/', req.url));

  const formData = await req.formData();
  const action = formData.get('action');

  if (action === 'create') {
    try {
      const app = await prisma.application.create({
        data: {
          name: formData.get('name') as string,
          packageName: formData.get('packageName') as string,
          platform: formData.get('platform') as string,
        }
      });
      await prisma.auditLog.create({ data: { userId: session.userId, action: 'CREATE_APPLICATION', targetId: app.id, targetType: 'application' } });
    } catch (e) {
      console.error(e);
    }
  } else if (action === 'delete') {
    const id = parseInt(formData.get('id') as string, 10);
    await prisma.application.delete({ where: { id } });
    await prisma.auditLog.create({ data: { userId: session.userId, action: 'DELETE_APPLICATION', targetId: id, targetType: 'application' } });
  }

  return NextResponse.redirect(new URL('/applications', req.url));
}
