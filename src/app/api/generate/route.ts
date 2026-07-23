import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateLicensePayload } from '@/lib/crypto';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    const { applicationId, deviceFingerprint, type, customHours, customDays, clientName, clientPhone, notes } = data;

    const appId = parseInt(applicationId, 10);
    if (!appId || !deviceFingerprint) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const issueDate = new Date();
    const expiryDate = new Date();
    let displayType = type || '30 Days';

    if (type === 'Custom Hours' && customHours && !isNaN(Number(customHours))) {
      const hrs = Math.max(1, parseInt(customHours, 10));
      expiryDate.setHours(expiryDate.getHours() + hrs);
      displayType = `${hrs} Hour${hrs > 1 ? 's' : ''}`;
    } else if (type === 'Custom Days' && customDays && !isNaN(Number(customDays))) {
      const days = Math.max(1, parseInt(customDays, 10));
      expiryDate.setDate(expiryDate.getDate() + days);
      displayType = `${days} Day${days > 1 ? 's' : ''}`;
    } else if (typeof type === 'string' && type.includes('Hour') && !isNaN(parseInt(type, 10))) {
      const hrs = parseInt(type, 10);
      expiryDate.setHours(expiryDate.getHours() + hrs);
    } else if (typeof type === 'string' && type.includes('Day') && !isNaN(parseInt(type, 10))) {
      const days = parseInt(type, 10);
      expiryDate.setDate(expiryDate.getDate() + days);
    } else {
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
    }

    const payload = await generateLicensePayload(appId, deviceFingerprint, issueDate, expiryDate, displayType, 'Active');

    const license = await prisma.license.create({
      data: {
        applicationId: appId,
        deviceFingerprint,
        issueDate,
        expiryDate,
        type: displayType,
        status: 'Active',
        salt: payload.salt,
        signature: payload.signature,
        payload: payload.humanCode,
        clientName: clientName ? String(clientName).trim() : null,
        clientPhone: clientPhone ? String(clientPhone).trim() : null,
        notes: notes ? String(notes).trim() : null,
        generatedById: session.userId,
      }
    });

    await prisma.auditLog.create({ data: { userId: session.userId, action: 'GENERATE_LICENSE', targetId: license.id, targetType: 'license' } });

    return NextResponse.json({
      ...payload,
      expiryDate: expiryDate.toISOString(),
      clientName: license.clientName,
      clientPhone: license.clientPhone,
      notes: license.notes
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
