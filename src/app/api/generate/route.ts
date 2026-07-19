import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateLicensePayload } from '@/lib/crypto';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    const { applicationId, deviceFingerprint, type } = data;

    const appId = parseInt(applicationId, 10);
    if (!appId || !deviceFingerprint) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const issueDate = new Date();
    const expiryDate = new Date();
    
    switch (type) {
      case '1 Hour': expiryDate.setHours(expiryDate.getHours() + 1); break;
      case '24 Hours': expiryDate.setHours(expiryDate.getHours() + 24); break;
      case '7 Days': expiryDate.setDate(expiryDate.getDate() + 7); break;
      case '30 Days': expiryDate.setDate(expiryDate.getDate() + 30); break;
      case '90 Days': expiryDate.setDate(expiryDate.getDate() + 90); break;
      case '180 Days': expiryDate.setDate(expiryDate.getDate() + 180); break;
      case '365 Days': expiryDate.setDate(expiryDate.getDate() + 365); break;
      case 'Lifetime': expiryDate.setFullYear(expiryDate.getFullYear() + 100); break;
      default: expiryDate.setDate(expiryDate.getDate() + 30);
    }

    const payload = await generateLicensePayload(appId, deviceFingerprint, issueDate, expiryDate, type, 'Active');

    const license = await prisma.license.create({
      data: {
        applicationId: appId,
        deviceFingerprint,
        issueDate,
        expiryDate,
        type,
        status: 'Active',
        salt: payload.salt,
        signature: payload.signature,
        payload: payload.humanCode,
        generatedById: session.userId,
      }
    });

    await prisma.auditLog.create({ data: { userId: session.userId, action: 'GENERATE_LICENSE', targetId: license.id, targetType: 'license' } });

    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
