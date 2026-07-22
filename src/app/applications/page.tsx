import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function ApplicationsPage() {
  const session = await getSession();
  if (!session) redirect('/');

  let apps: any[] = [];
  try {
    apps = await prisma.application.findMany({ orderBy: { id: 'desc' } });
  } catch (e) {
    console.error('Applications database error:', e);
  }

  return (
    <div>
      <div className="card">
        <h2 className="font-semibold text-lg sm:text-xl">NEW APPLICATION</h2>
        <form method="POST" action="/api/applications" className="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-end mt-2">
          <input type="hidden" name="action" value="create" />
          <div className="flex-1 w-full">
            <label className="block text-accent mb-1 text-xs font-semibold">Name</label>
            <input type="text" name="name" className="input-field" placeholder="Mobawi App" required />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-accent mb-1 text-xs font-semibold">Package Name</label>
            <input type="text" name="packageName" className="input-field" placeholder="com.mobawi.app" required />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-accent mb-1 text-xs font-semibold">Platform</label>
            <select name="platform" className="input-field">
              <option value="Flutter">Flutter</option>
              <option value="React Native">React Native</option>
              <option value="Windows">Windows</option>
              <option value="Desktop">Desktop</option>
            </select>
          </div>
          <button type="submit" className="btn w-full md:w-auto">CREATE</button>
        </form>
      </div>

      <h2 className="font-semibold text-lg sm:text-xl mt-6 mb-3">REGISTERED APPLICATIONS</h2>
      <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
        <table className="table-main mt-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Package</th>
              <th>Platform</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <tr key={app.id}>
                <td>{app.id}</td>
                <td className="font-medium text-accent">{app.name}</td>
                <td className="font-mono text-xs">{app.packageName}</td>
                <td>{app.platform}</td>
                <td><span className="px-2 py-0.5 rounded text-xs bg-success/10 text-success border border-success/20">{app.status}</span></td>
                <td className="text-xs text-foreground/80">{new Date(app.createdAt).toLocaleDateString()}</td>
                <td>
                  <form method="POST" action="/api/applications" className="inline">
                    <input type="hidden" name="action" value="delete" />
                    <input type="hidden" name="id" value={app.id} />
                    <button type="submit" className="text-error border-error/50 hover:bg-error/10 border px-2.5 py-1 text-xs rounded transition-colors">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
            {apps.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-6 text-foreground/60">No applications registered.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
