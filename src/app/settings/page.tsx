import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSystemKeypair } from '@/lib/crypto';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect('/');

  const keys = await getSystemKeypair();
  const logs = await prisma.auditLog.findMany({
    orderBy: { id: 'desc' },
    include: { user: true },
    take: 20
  });

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-5 mb-10">
        <div className="card flex-1">
          <h2>SYSTEM KEYS (Ed25519)</h2>
          <p className="mb-4">This public key MUST be embedded in your client applications (Flutter/React Native).</p>
          
          <div className="mt-4">
            <label className="text-accent block">Public Key (Base64)</label>
            <div className="mono-block text-success">{keys.pubBase64}</div>
          </div>
          
          <div className="mt-4">
            <label className="text-accent block">Private Key</label>
            <div className="mono-block text-error">[ REDACTED FROM UI ]</div>
          </div>
        </div>
        
        <div className="card flex-1">
          <h2>CHANGE PASSWORD</h2>
          <form method="POST" action="/api/settings/password" className="flex flex-col gap-4">
            <div>
              <label className="block text-accent mb-1">New Password</label>
              <input type="password" name="password" className="input-field" required />
            </div>
            <button type="submit" className="btn mt-2">UPDATE PASSWORD</button>
          </form>
        </div>
      </div>

      <h2>RECENT AUDIT LOGS</h2>
      <div className="overflow-x-auto">
        <table className="table-main">
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
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.user?.username || 'System'}</td>
                <td>{log.action}</td>
                <td>{log.targetType || ''}</td>
                <td>{log.targetId || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
