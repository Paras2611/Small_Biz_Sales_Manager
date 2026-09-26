import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, CalendarPlus, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Drawer } from '../components/ui/Drawer';
import { TableSkeleton } from '../components/ui/Skeleton';
import { formatDate, formatCurrency } from '../utils/formatters';
import api from '../api/client';

export function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Lead Form State
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    source: 'Website',
    estimated_value: 100000,
    notes: '',
  });

  const fetchLeads = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/leads', { params });
      setLeads(res.data);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/leads', {
        customer: {
          name: form.name,
          company: form.company,
          email: form.email || null,
          phone: form.phone || null,
        },
        source: form.source,
        estimated_value: form.estimated_value,
        notes: form.notes,
      });
      setIsDrawerOpen(false);
      setForm({ name: '', company: '', email: '', phone: '', source: 'Website', estimated_value: 100000, notes: '' });
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#1A2E4A]">Leads Pipeline</h2>
          <p className="text-xs text-[#6B7C93] mt-0.5">Capture, qualify, and convert prospective clients</p>
        </div>
        <Button onClick={() => setIsDrawerOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Create Lead
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#6B7C93]" />
          <input
            type="text"
            placeholder="Search by prospect name, company, or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#D1D9E6] rounded-[6px] focus:outline-none focus:border-[#3A7BD5]"
          />
        </div>
        <div className="w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-sm bg-white border border-[#D1D9E6] rounded-[6px] focus:outline-none focus:border-[#3A7BD5]"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Disqualified">Disqualified</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#6B7C93]">No leads found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F5F7FA] border-b border-[#D1D9E6] text-xs font-semibold text-[#1A2E4A]">
                  <th className="py-3 px-4">Contact & Company</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Est. Value</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#F5F7FA] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1F2937]">{lead.customer?.name || '—'}</div>
                      <div className="text-xs text-[#6B7C93]">{lead.customer?.company || '—'}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#1F2937]">{lead.source}</td>
                    <td className="py-3 px-4">
                      <Badge status={lead.status} />
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        lead.score >= 70 ? 'bg-[#ECFDF5] text-[#10B981]' : lead.score >= 40 ? 'bg-[#FFFBEB] text-[#D97706]' : 'bg-[#F3F4F6] text-[#6B7280]'
                      }`}>
                        {lead.score}/100
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{formatCurrency(lead.estimated_value)}</td>
                    <td className="py-3 px-4 text-xs text-[#6B7C93]">{lead.owner?.name || 'Unassigned'}</td>
                    <td className="py-3 px-4 text-xs text-[#6B7C93]">{formatDate(lead.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="inline-flex items-center text-xs font-semibold text-[#2B5FAD] hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Slide-over Drawer for Create Lead */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Create New Lead"
        subtitle="Capture initial prospect and commercial intent"
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          <Input
            label="Contact Person Name *"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Rajesh Kumar"
          />
          <Input
            label="Company Name *"
            required
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="e.g. ABC Manufacturing Pvt Ltd"
          />
          <Input
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="contact@abcmfg.demo"
          />
          <Input
            label="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+91 98765 43210"
          />
          <Select
            label="Lead Source"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            options={[
              { value: 'Website', label: 'Website' },
              { value: 'Referral', label: 'Referral' },
              { value: 'Trade Show', label: 'Trade Show' },
              { value: 'Social Media', label: 'Social Media' },
              { value: 'Outbound Campaign', label: 'Outbound Campaign' },
            ]}
          />
          <Input
            label="Estimated Commercial Value (₹)"
            type="number"
            value={form.estimated_value}
            onChange={(e) => setForm({ ...form, estimated_value: e.target.value })}
          />
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-medium text-[#1F2937]">Initial Requirement Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="p-3 text-sm bg-white border border-[#D1D9E6] rounded-[6px] focus:outline-none focus:border-[#3A7BD5]"
              placeholder="Key business pain points, requirements..."
            />
          </div>
          <div className="pt-4 flex gap-3">
            <Button type="submit" className="flex-1" isLoading={saving}>
              Save Lead
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
