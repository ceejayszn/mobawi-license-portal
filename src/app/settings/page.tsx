import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSystemKeypair } from '@/lib/crypto';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect('/');

  const keys = await getSystemKeypair();
  let logs: any[] = [];
  try {
    logs = await prisma.auditLog.findMany({
      orderBy: { id: 'desc' },
      include: { user: true },
      take: 20
    });
  } catch (e) {
    console.error('Settings database error:', e);
  }

  return (
    <div>
      <h2 className="font-semibold text-lg sm:text-xl mb-4">SYSTEM SETTINGS</h2>
      
      <div className="flex flex-col lg:flex-row gap-5 mb-8">
        <div className="card flex-1">
          <h2 className="font-semibold text-lg sm:text-xl mb-2">SYSTEM KEYS (Ed25519)</h2>
          <p className="text-xs sm:text-sm text-foreground/80 mb-4">This public key MUST be embedded in your client applications (Flutter/React Native).</p>
          
          <div className="mt-4">
            <label className="text-accent block text-xs font-semibold">Public Key (Base64)</label>
            <div className="mono-block text-success text-xs sm:text-sm break-all">{keys.pubBase64}</div>
          </div>
          
          <div className="mt-4">
            <label className="text-accent block text-xs font-semibold">Private Key</label>
            <div className="mono-block text-error text-xs">[ REDACTED FROM UI ]</div>
          </div>
        </div>
        
        <div className="card flex-1">
          <h2 className="font-semibold text-lg sm:text-xl mb-2">CHANGE PASSWORD</h2>
          <form method="POST" action="/api/settings/password" className="flex flex-col gap-4 mt-4">
            <div>
              <label className="block text-accent mb-1 text-xs font-semibold">New Password</label>
              <input type="password" name="password" className="input-field" required placeholder="Enter new password" />
            </div>
            <button type="submit" className="btn mt-2 w-full sm:w-auto">UPDATE PASSWORD</button>
          </form>
        </div>
      </div>

      <h2 className="font-semibold text-lg sm:text-xl mb-3">RECENT AUDIT LOGS</h2>
      <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
        <table className="table-main mt-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Target Type</th>
              <th>Target ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td className="text-xs text-foreground/80">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="font-medium text-accent">{log.user?.username || 'System'}</td>
                <td className="font-mono text-xs">{log.action}</td>
                <td className="text-xs">{log.targetType || '-'}</td>
                <td className="text-xs">{log.targetId || '-'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-6 text-foreground/60">No audit logs recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
