import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import api from '../api/client';

export function Admin() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'sales_executive' });

  const fetchAdminData = async () => {
    try {
      const [uRes, sRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/settings'),
      ]);
      setUsers(uRes.data);
      setSettings(sRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', newUser);
      setAddUserOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'sales_executive' });
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create user');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1A2E4A]">System Administration & Masters</h2>
        <p className="text-xs text-[#6B7C93] mt-0.5">Manage user credentials, roles, pipeline stages, and tax configurations</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#D1D9E6] gap-6">
        {[
          { id: 'users', label: 'User Management' },
          { id: 'stages', label: 'Pipeline Stages' },
          { id: 'sources', label: 'Lead Sources' },
          { id: 'tax', label: 'Tax Rules' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.id
                ? 'border-[#2B5FAD] text-[#2B5FAD]'
                : 'border-transparent text-[#6B7C93] hover:text-[#1A2E4A]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Users */}
      {tab === 'users' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-[#F5F7FA] border-b flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#1A2E4A]">Active Team Members</h3>
            <Button size="sm" onClick={() => setAddUserOpen(true)}>Add User</Button>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7FA] border-b text-[#6B7C93]">
              <tr>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F7]">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-3 px-4 font-semibold text-[#1A2E4A]">{u.name}</td>
                  <td className="py-3 px-4 text-[#6B7C93]">{u.email}</td>
                  <td className="py-3 px-4"><Badge status="New" label={u.role} /></td>
                  <td className="py-3 px-4"><Badge status={u.active ? 'Qualified' : 'Disqualified'} label={u.active ? 'Active' : 'Disabled'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Tab: Stages */}
      {tab === 'stages' && settings && (
        <Card>
          <CardHeader title="Configured Pipeline Stages" subtitle="Used in Kanban boards and sales forecasting" />
          <div className="space-y-2">
            {settings.pipeline_stages.map((st, i) => (
              <div key={i} className="p-2.5 bg-[#F5F7FA] rounded border text-xs font-semibold text-[#1A2E4A] flex justify-between">
                <span>{i + 1}. {st}</span>
                <span className="text-[10px] text-[#10B981]">Active</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab: Sources */}
      {tab === 'sources' && settings && (
        <Card>
          <CardHeader title="Configured Lead Sources" subtitle="Master list of lead acquisition channels" />
          <div className="space-y-2">
            {settings.lead_sources.map((src, i) => (
              <div key={i} className="p-2.5 bg-[#F5F7FA] rounded border text-xs font-semibold text-[#1A2E4A] flex justify-between">
                <span>{src}</span>
                <span className="text-[10px] text-[#2B5FAD]">Standard Channel</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab: Tax */}
      {tab === 'tax' && settings && (
        <Card>
          <CardHeader title="Tax Classification Rules" subtitle="Automated GST rates for line item calculations" />
          <div className="space-y-2">
            {settings.tax_rules.map((tr, i) => (
              <div key={i} className="p-2.5 bg-[#F5F7FA] rounded border text-xs font-semibold text-[#1A2E4A] flex justify-between">
                <span>{tr.class}</span>
                <span className="font-mono text-[#10B981]">{tr.rate}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add User Modal */}
      <Modal isOpen={addUserOpen} onClose={() => setAddUserOpen(false)} title="Create Team Member">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input label="Full Name *" required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
          <Input label="Email Address *" type="email" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          <Input label="Initial Password *" type="password" required value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
          <div>
            <label className="text-xs font-medium text-[#1F2937] block mb-1">Access Role *</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full p-2 border rounded text-xs bg-white"
            >
              <option value="sales_executive">Sales Executive</option>
              <option value="sales_manager">Sales Manager</option>
              <option value="administrator">Administrator</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddUserOpen(false)}>Cancel</Button>
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
