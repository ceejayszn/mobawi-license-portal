'use client';

import { useState, useEffect } from 'react';

interface Application {
  id: number;
  name: string;
  packageName: string;
  platform: string;
  status: string;
  createdAt: string;
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    packageName: '',
    platform: 'Flutter'
  });

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setApps(data);
      }
    } catch (e) {
      console.error('Failed to load applications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...formData
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create application.');
      } else {
        setSuccess(`Application "${formData.name}" created successfully!`);
        setFormData({ name: '', packageName: '', platform: 'Flutter' });
        await fetchApplications();
      }
    } catch (e) {
      setError('A network error occurred while creating the application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, appName: string) => {
    if (!confirm(`Are you sure you want to delete "${appName}"?`)) return;

    setError('');
    setSuccess('');
    setDeletingId(id);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to delete application.');
      } else {
        setSuccess(`Application "${appName}" deleted.`);
        setApps(prev => prev.filter(app => app.id !== id));
      }
    } catch (e) {
      setError('A network error occurred while deleting.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* Alert Notifications */}
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-error/10 border border-error/30 text-error flex items-center justify-between text-sm">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-error font-bold ml-4">✕</button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 rounded-lg bg-success/10 border border-success/30 text-success flex items-center justify-between text-sm">
          <span>✓ {success}</span>
          <button onClick={() => setSuccess('')} className="text-success font-bold ml-4">✕</button>
        </div>
      )}

      {/* New Application Form Card */}
      <div className="card">
        <h2 className="font-semibold text-lg sm:text-xl">NEW APPLICATION</h2>
        <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-end mt-2">
          <div className="flex-1 w-full">
            <label className="block text-accent mb-1 text-xs font-semibold">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="Mobawi App"
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-accent mb-1 text-xs font-semibold">Package Name</label>
            <input
              type="text"
              name="packageName"
              value={formData.packageName}
              onChange={e => setFormData({ ...formData, packageName: e.target.value })}
              className="input-field"
              placeholder="com.mobawi.app"
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-accent mb-1 text-xs font-semibold">Platform</label>
            <select
              name="platform"
              value={formData.platform}
              onChange={e => setFormData({ ...formData, platform: e.target.value })}
              className="input-field"
            >
              <option value="Flutter">Flutter</option>
              <option value="React Native">React Native</option>
              <option value="Windows">Windows</option>
              <option value="Desktop">Desktop</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
          >
            {submitting ? 'CREATING...' : 'CREATE'}
          </button>
        </form>
      </div>

      {/* Registered Applications List */}
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
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center p-6 text-foreground/60">Loading applications...</td>
              </tr>
            ) : apps.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-6 text-foreground/60">No applications registered.</td>
              </tr>
            ) : (
              apps.map(app => (
                <tr key={app.id}>
                  <td>{app.id}</td>
                  <td className="font-medium text-accent">{app.name}</td>
                  <td className="font-mono text-xs">{app.packageName}</td>
                  <td>{app.platform}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded text-xs bg-success/10 text-success border border-success/20">
                      {app.status}
                    </span>
                  </td>
                  <td className="text-xs text-foreground/80">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(app.id, app.name)}
                      disabled={deletingId === app.id}
                      className="text-error border-error/50 hover:bg-error/10 border px-2.5 py-1 text-xs rounded transition-colors disabled:opacity-50"
                    >
                      {deletingId === app.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
