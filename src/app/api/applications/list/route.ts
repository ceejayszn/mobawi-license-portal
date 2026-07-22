import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apps = await prisma.application.findMany({ select: { id: true, name: true, platform: true }, where: { status: 'Active' } });
    return NextResponse.json(apps);
  } catch (e) {
    return NextResponse.json([]);
  }
}
