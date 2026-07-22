import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const apps = await prisma.application.findMany({ orderBy: { id: 'desc' } });
    return NextResponse.json(apps);
  } catch (e: any) {
    return NextResponse.json({ error: 'Database error fetching applications' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    const isJson = req.headers.get('content-type')?.includes('application/json');
    if (isJson) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.redirect(new URL('/', req.url), 303);
  }

  const contentType = req.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let action = '';
  let name = '';
  let packageName = '';
  let platform = 'Flutter';
  let id: number | null = null;

  if (isJson) {
    const body = await req.json().catch(() => ({}));
    action = body.action || '';
    name = body.name || '';
    packageName = body.packageName || '';
    platform = body.platform || 'Flutter';
    id = body.id ? parseInt(body.id, 10) : null;
  } else {
    const formData = await req.formData().catch(() => new FormData());
    action = (formData.get('action') as string) || '';
    name = (formData.get('name') as string) || '';
    packageName = (formData.get('packageName') as string) || '';
    platform = (formData.get('platform') as string) || 'Flutter';
    const rawId = formData.get('id') as string;
    id = rawId ? parseInt(rawId, 10) : null;
  }

  if (action === 'create') {
    const cleanName = name.trim();
    const cleanPackageName = packageName.trim();
    const cleanPlatform = platform.trim();

    if (!cleanName || !cleanPackageName || !cleanPlatform) {
      const errorMsg = 'Please fill in all fields (Name, Package Name, Platform).';
      if (isJson) return NextResponse.json({ error: errorMsg }, { status: 400 });
      return NextResponse.redirect(new URL(`/applications?error=${encodeURIComponent(errorMsg)}`, req.url), 303);
    }

    try {
      // Check if package name already exists
      const existing = await prisma.application.findUnique({
        where: { packageName: cleanPackageName }
      });
      if (existing) {
        const errorMsg = `Package name "${cleanPackageName}" is already registered by another application.`;
        if (isJson) return NextResponse.json({ error: errorMsg }, { status: 409 });
        return NextResponse.redirect(new URL(`/applications?error=${encodeURIComponent(errorMsg)}`, req.url), 303);
      }

      const app = await prisma.application.create({
        data: { name: cleanName, packageName: cleanPackageName, platform: cleanPlatform }
      });

      await prisma.auditLog.create({
        data: { userId: session.userId, action: 'CREATE_APPLICATION', targetId: app.id, targetType: 'application' }
      }).catch(() => {});

      if (isJson) return NextResponse.json({ success: true, app }, { status: 201 });
      return NextResponse.redirect(new URL('/applications?success=Application+created+successfully', req.url), 303);
    } catch (e: any) {
      console.error('Error creating application:', e);
      const errorMsg = e.code === 'P2002' ? 'Package name must be unique.' : (e.message || 'Failed to create application.');
      if (isJson) return NextResponse.json({ error: errorMsg }, { status: 500 });
      return NextResponse.redirect(new URL(`/applications?error=${encodeURIComponent(errorMsg)}`, req.url), 303);
    }
  } else if (action === 'delete') {
    if (!id || isNaN(id)) {
      const errorMsg = 'Invalid application ID.';
      if (isJson) return NextResponse.json({ error: errorMsg }, { status: 400 });
      return NextResponse.redirect(new URL(`/applications?error=${encodeURIComponent(errorMsg)}`, req.url), 303);
    }

    try {
      await prisma.application.delete({ where: { id } });
      await prisma.auditLog.create({
        data: { userId: session.userId, action: 'DELETE_APPLICATION', targetId: id, targetType: 'application' }
      }).catch(() => {});

      if (isJson) return NextResponse.json({ success: true, id });
      return NextResponse.redirect(new URL('/applications?success=Application+deleted+successfully', req.url), 303);
    } catch (e: any) {
      console.error('Error deleting application:', e);
      const errorMsg = e.message || 'Failed to delete application.';
      if (isJson) return NextResponse.json({ error: errorMsg }, { status: 500 });
      return NextResponse.redirect(new URL(`/applications?error=${encodeURIComponent(errorMsg)}`, req.url), 303);
    }
  }

  if (isJson) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  return NextResponse.redirect(new URL('/applications', req.url), 303);
}
