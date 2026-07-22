import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const apps = await prisma.application.findMany({ select: { id: true, name: true, platform: true }, where: { status: 'Active' } });
    return NextResponse.json(apps);
  } catch (e) {
    return NextResponse.json([]);
  }
}
