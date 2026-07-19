import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function ApplicationsPage() {
  const session = await getSession();
  if (!session) redirect('/');

  const apps = await prisma.application.findMany({ orderBy: { id: 'desc' } });

  return (
    <div>
      <div className="card">
        <h2>NEW APPLICATION</h2>
        <form method="POST" action="/api/applications" className="flex flex-col sm:flex-row gap-4 items-end">
          <input type="hidden" name="action" value="create" />
          <div className="flex-1 w-full">
            <label className="block text-accent mb-1">Name</label>
            <input type="text" name="name" className="input-field" placeholder="Mobawi App" required />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-accent mb-1">Package Name</label>
            <input type="text" name="packageName" className="input-field" placeholder="com.mobawi.app" required />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-accent mb-1">Platform</label>
            <select name="platform" className="input-field">
              <option value="Flutter">Flutter</option>
              <option value="React Native">React Native</option>
              <option value="Windows">Windows</option>
              <option value="Desktop">Desktop</option>
            </select>
          </div>
          <button type="submit" className="btn w-full sm:w-auto">CREATE</button>
        </form>
      </div>

      <h2>REGISTERED APPLICATIONS</h2>
      <div className="overflow-x-auto">
        <table className="table-main">
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
                <td>{app.name}</td>
                <td>{app.packageName}</td>
                <td>{app.platform}</td>
                <td>{app.status}</td>
                <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                <td>
                  <form method="POST" action="/api/applications" className="inline">
                    <input type="hidden" name="action" value="delete" />
                    <input type="hidden" name="id" value={app.id} />
                    <button type="submit" className="text-error border-error border px-2 py-1 text-xs">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
            {apps.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-4">No applications registered.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
