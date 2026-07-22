import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/');

  let totalApps = 0;
  let totalLicenses = 0;
  let todaysLicenses = 0;
  let activeLicenses = 0;
  let expiredLicenses = 0;
  let revokedLicenses = 0;
  let suspendedLicenses = 0;

  try {
    totalApps = await prisma.application.count();
    totalLicenses = await prisma.license.count();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    todaysLicenses = await prisma.license.count({
      where: { createdAt: { gte: today } }
    });

    activeLicenses = await prisma.license.count({ where: { status: 'Active' } });
    expiredLicenses = await prisma.license.count({ where: { expiryDate: { lt: new Date() } } });
    revokedLicenses = await prisma.license.count({ where: { status: 'Revoked' } });
    suspendedLicenses = await prisma.license.count({ where: { status: 'Suspended' } });
  } catch (e) {
    console.error('Dashboard database error:', e);
  }

  const stats = [
    { label: 'Total Applications', value: totalApps },
    { label: 'Total Licenses', value: totalLicenses },
    { label: "Today's Licenses", value: todaysLicenses },
    { label: 'Active Licenses', value: activeLicenses },
    { label: 'Expired Licenses', value: expiredLicenses },
    { label: 'Revoked Licenses', value: revokedLicenses },
    { label: 'Suspended Licenses', value: suspendedLicenses },
  ];

  return (
    <div>
      <h2>SYSTEM DASHBOARD</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-border p-4 text-center">
            <div>{stat.label}</div>
            <div className="text-3xl text-accent mt-2">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
