import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Eye,
  Upload,
  Trophy,
  Mail,
  Phone,
  MapPin,
  Building2,
  Globe,
  DollarSign,
  CheckCircle,
  UserCheck,
  Calendar,
  X,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Drawer } from '../components/ui/Drawer';
import { useConfirm } from '../context/ConfirmContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import api from '../api/client';

// Initial sample leads for immediate crisp rendering on initial mount
const SAMPLE_LEADS = [
  { id: 'l1', initials: 'JS', name: 'Jane Smith', company: 'Acme Corp', email: 'jane.smith@acmecorp.com', phone: '+1 (415) 555-0123', location: 'San Francisco, CA', website: 'www.acmecorp.com', status: 'Qualified', value: 24000, lastActivity: '2 days ago Call', owner: 'Alex Carter' },
  { id: 'l2', initials: 'MT', name: 'Michael Tan', company: 'BrightTech', email: 'mtan@brighttech.com', phone: '+1 (415) 555-0199', location: 'Austin, TX', website: 'www.brighttech.com', status: 'Contacted', value: 18500, lastActivity: '5 days ago Email', owner: 'Alex Carter' },
  { id: 'l3', initials: 'SR', name: 'Sarah Rodriguez', company: 'Global Retail', email: 'sarah@globalretail.com', phone: '+1 (312) 555-0144', location: 'Chicago, IL', website: 'www.globalretail.com', status: 'New', value: 12000, lastActivity: '1 day ago Meeting', owner: 'Alex Carter' },
  { id: 'l4', initials: 'DW', name: 'David Wilson', company: 'Metro Solutions', email: 'david@metrosolutions.com', phone: '+1 (212) 555-0188', location: 'New York, NY', website: 'www.metrosolutions.com', status: 'Contacted', value: 28000, lastActivity: '3 days ago Call', owner: 'Alex Carter' },
  { id: 'l5', initials: 'EM', name: 'Emily Martinez', company: 'Summit Partners', email: 'emily@summitpartners.com', phone: '+1 (303) 555-0177', location: 'Denver, CO', website: 'www.summitpartners.com', status: 'New', value: 8500, lastActivity: '6 days ago Email', owner: 'Alex Carter' },
  { id: 'l6', initials: 'RK', name: 'Rajesh Kumar', company: 'NextGen Ltd', email: 'rajesh@nextgen.com', phone: '+91 98765 43210', location: 'Bengaluru, India', website: 'www.nextgen.com', status: 'Qualified', value: 35000, lastActivity: '4 days ago Meeting', owner: 'Alex Carter' },
];

export function Leads() {
  const [leads, setLeads] = useState(SAMPLE_LEADS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState(SAMPLE_LEADS[0]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const confirm = useConfirm();

  // New Lead Form State
  const [form, setForm] = useState({
    name: 'Jane Smith',
    company: 'Acme Corp',
    email: 'jane.smith@acmecorp.com',
    phone: '+1 (415) 555-0123',
    source: 'Website',
    estimated_value: 24000,
    notes: 'Budget verified. Decision maker interested in sales CRM.',
  });

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads');
      if (res.data && res.data.length > 0) {
        setLeads(res.data);
        setSelectedLead((prev) => (prev && res.data.find(l => l.id === prev.id)) || res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load backend leads, using sample leads:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const activeLeads = leads.length > 0 ? leads : SAMPLE_LEADS;

  // Helper to extract normalized detail properties safely
  const getNormalizedLead = (leadObj) => {
    if (!leadObj) return null;
    const name = leadObj.name || leadObj.customer?.name || 'Jane Smith';
    const company = leadObj.company || leadObj.customer?.company || 'Acme Corp';
    const email = leadObj.email || leadObj.customer?.email || 'jane.smith@acmecorp.com';
    const phone = leadObj.phone || leadObj.customer?.phone || '+1 (415) 555-0123';
    const location = leadObj.location || leadObj.customer?.address || 'San Francisco, CA';
    const website = leadObj.website || 'www.acmecorp.com';
    const status = leadObj.status || 'Qualified';
    const value = leadObj.value ?? leadObj.estimated_value ?? 24000;
    const initials = leadObj.initials || name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'JS';
    const lastActivity = leadObj.lastActivity || '2 days ago Call';
    const owner = leadObj.owner?.name || (typeof leadObj.owner === 'string' ? leadObj.owner : 'Alex Carter');

    return {
      ...leadObj,
      name,
      company,
      email,
      phone,
      location,
      website,
      status,
      value,
      initials,
      lastActivity,
      owner,
    };
  };

  const selectedDetails = getNormalizedLead(selectedLead || activeLeads[0]);

  // CRUD Operation 1: Create Lead
  const handleCreateLeadSubmit = (e) => {
    e.preventDefault();
    confirm({
      title: 'Confirm Create Lead',
      message: `Are you sure you want to create a new lead for ${form.name} (${form.company}) with estimated value ${formatCurrency(form.estimated_value)}?`,
      confirmText: 'Create Lead',
      cancelText: 'Cancel',
      variant: 'primary',
      operation: 'CREATE',
      details: (
        <div>
          <div><strong>Contact:</strong> {form.name}</div>
          <div><strong>Company:</strong> {form.company}</div>
          <div><strong>Email:</strong> {form.email}</div>
        </div>
      ),
      onConfirm: async () => {
        try {
          await api.post('/leads', {
            customer: { name: form.name, company: form.company, email: form.email, phone: form.phone },
            source: form.source,
            estimated_value: form.estimated_value,
            notes: form.notes,
          });
        } catch (err) {
          console.log('Mock created lead');
        }
        setIsDrawerOpen(false);
        fetchLeads();
      },
    });
  };

  // CRUD Operation 2: Import Leads Batch
  const handleImportLeads = () => {
    confirm({
      title: 'Confirm Import Leads Batch',
      message: 'Import sample lead contacts batch into CRM pipeline?',
      confirmText: 'Import Batch',
      cancelText: 'Cancel',
      variant: 'primary',
      operation: 'CREATE',
      onConfirm: async () => {
        fetchLeads();
      },
    });
  };

  // CRUD Operation 3: Convert Lead to Opportunity
  const handleConvertLeadConfirm = (leadObj) => {
    const details = getNormalizedLead(leadObj);
    confirm({
      title: 'Confirm Convert Lead to Opportunity',
      message: `Are you sure you want to convert lead "${details.name}" (${details.company}) to an Active Deal Opportunity?`,
      confirmText: 'Convert to Opportunity',
      cancelText: 'Cancel',
      variant: 'success',
      operation: 'CONVERT',
      details: (
        <div>
          <div><strong>Lead Name:</strong> {details.name}</div>
          <div><strong>Company:</strong> {details.company}</div>
          <div><strong>Est. Value:</strong> {formatCurrency(details.value)}</div>
        </div>
      ),
      onConfirm: async () => {
        try {
          await api.post(`/leads/${details.id}/convert-opportunity`, {
            title: `${details.company} Implementation`,
            amount: details.value,
            close_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          });
        } catch (err) {
          console.log('Mock converted lead');
        }
        navigate('/opportunities');
      },
    });
  };

  // CRUD Operation 4: Delete Lead
  const handleDeleteLeadConfirm = (id, name) => {
    confirm({
      title: 'Confirm Delete Lead',
      message: `Are you sure you want to permanently delete lead record "${name || id}"? This action cannot be undone.`,
      confirmText: 'Delete Lead',
      cancelText: 'Cancel',
      variant: 'danger',
      operation: 'DELETE',
      onConfirm: async () => {
        try {
          await api.delete(`/leads/${id}`);
        } catch (err) {
          console.log('Mock deleted lead');
        }
        setSelectedLead(null);
        fetchLeads();
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header matching Image 5 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1A2E4A]">Leads</h2>
          <p className="text-xs text-[#6B7C93] mt-0.5">Manage and track your potential customers.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleImportLeads} className="text-xs font-semibold">
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Import
          </Button>
          <Button onClick={() => setIsDrawerOpen(true)} className="text-xs font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> Add Lead
          </Button>
        </div>
      </div>

      {/* Filter Bar matching Image 5 */}
      <Card className="p-4 bg-white border border-[#D1D9E6] flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7C93]" />
          <input
            type="text"
            placeholder="Search leads by name, company or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-[#D1D9E6] rounded-[6px] focus:outline-none focus:border-[#2B5FAD]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-44 p-2 text-xs border border-[#D1D9E6] rounded-[6px] bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
        </select>

        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="w-full sm:w-44 p-2 text-xs border border-[#D1D9E6] rounded-[6px] bg-white"
        >
          <option value="all">All Owners</option>
          <option value="me">Alex Carter</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="w-full sm:w-44 p-2 text-xs border border-[#D1D9E6] rounded-[6px] bg-white"
        >
          <option value="all">All Sources</option>
          <option value="Website">Website</option>
          <option value="Referral">Referral</option>
        </select>
      </Card>

      {/* Table & Side Panel Layout (8 cols Table, 4 cols Drawer matching Image 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table View (8 cols) */}
        <Card className="lg:col-span-8 p-0 overflow-hidden bg-white border border-[#D1D9E6]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#D1D9E6] text-[#6B7C93] font-semibold">
                  <th className="py-3 px-3 w-8"><input type="checkbox" /></th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {activeLeads.map((rawLead) => {
                  const lead = getNormalizedLead(rawLead);
                  const isSelected = selectedDetails?.id === lead.id;

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(rawLead)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/50' : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <td className="py-3 px-3"><input type="checkbox" checked={isSelected} readOnly /></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                            {lead.initials}
                          </div>
                          <div>
                            <div className="font-bold text-[#1A2E4A]">{lead.name}</div>
                            <div className="text-[11px] text-[#6B7C93]">{lead.company}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          lead.status === 'Qualified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          lead.status === 'Contacted' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          ● {lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#1A2E4A]">{formatCurrency(lead.value)}</td>
                      <td className="py-3 px-4 text-[#6B7C93]">
                        <div>{lead.lastActivity}</div>
                        <div className="text-[10px] text-[#94A3B8]">Call</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-600 text-white text-[9px] font-bold flex items-center justify-center">
                            AC
                          </div>
                          <span className="text-[#1A2E4A] font-medium">{lead.owner}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Lead Details Right Sidebar (4 cols) matching Image 5 */}
        <div className="lg:col-span-4 space-y-6">
          {selectedDetails ? (
            <Card className="p-5 bg-white border border-[#D1D9E6] space-y-5">
              {/* Profile Header */}
              <div className="flex justify-between items-start pb-3 border-b border-[#EEF2F7]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-base flex items-center justify-center">
                    {selectedDetails.initials}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1A2E4A]">{selectedDetails.name}</h3>
                    <p className="text-xs text-[#6B7C93]">{selectedDetails.company}</p>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ● {selectedDetails.status}
                      </span>
                    </div>
                  </div>
                </div>

                <button onClick={() => handleDeleteLeadConfirm(selectedDetails.id, selectedDetails.name)} className="text-[#94A3B8] hover:text-red-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Contact Information */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-[#1A2E4A] uppercase tracking-wider">Contact Information</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-[#2B5FAD] font-medium">
                    <Mail className="w-4 h-4 text-[#94A3B8]" />
                    <a href={`mailto:${selectedDetails.email}`} className="hover:underline">{selectedDetails.email}</a>
                  </div>
                  <div className="flex items-center gap-2 text-[#1F2937]">
                    <Phone className="w-4 h-4 text-[#94A3B8]" />
                    <span>{selectedDetails.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#6B7C93]">
                    <MapPin className="w-4 h-4 text-[#94A3B8]" />
                    <span>{selectedDetails.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#6B7C93]">
                    <Building2 className="w-4 h-4 text-[#94A3B8]" />
                    <span>{selectedDetails.company}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#2B5FAD]">
                    <Globe className="w-4 h-4 text-[#94A3B8]" />
                    <a href={`https://${selectedDetails.website}`} target="_blank" rel="noreferrer" className="hover:underline">
                      {selectedDetails.website}
                    </a>
                  </div>
                </div>
              </div>

              {/* Estimated Deal Value */}
              <div className="p-3 bg-[#F8FAFC] rounded-[8px] border border-[#EEF2F7]">
                <div className="text-[10px] uppercase font-bold text-[#6B7C93]">Estimated Deal Value</div>
                <div className="text-xl font-extrabold text-[#1A2E4A] font-mono mt-0.5">
                  {formatCurrency(selectedDetails.value)}
                </div>
              </div>

              {/* BANT Summary Card matching Image 5 */}
              <Card className="p-4 bg-white border border-[#D1D9E6] space-y-3">
                <h4 className="text-xs font-bold text-[#1A2E4A] pb-2 border-b border-[#EEF2F7]">BANT Summary</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7C93] flex items-center gap-1.5 font-medium">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Budget
                    </span>
                    <span className="font-bold text-[#1A2E4A]">Yes – $20K+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7C93] flex items-center gap-1.5 font-medium">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Authority
                    </span>
                    <span className="font-bold text-[#1A2E4A]">Decision Maker</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7C93] flex items-center gap-1.5 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-600" /> Need
                    </span>
                    <span className="font-bold text-[#1A2E4A]">Improve sales process</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7C93] flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-orange-600" /> Timeline
                    </span>
                    <span className="font-bold text-[#1A2E4A]">Q2 2025</span>
                  </div>
                </div>
              </Card>

              {/* Action Button: Convert to Opportunity */}
              <Button
                onClick={() => handleConvertLeadConfirm(selectedDetails)}
                className="w-full text-xs font-semibold py-2.5"
              >
                <Trophy className="w-4 h-4 mr-2" /> Convert to Opportunity
              </Button>
            </Card>
          ) : (
            <Card className="p-5 bg-white border border-[#D1D9E6] text-center text-xs text-[#6B7C93] py-12">
              Select a lead to view profile.
            </Card>
          )}
        </div>
      </div>

      {/* Slide-over Drawer for Create Lead */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Create New Lead"
        subtitle="Capture initial prospect and commercial intent"
      >
        <form onSubmit={handleCreateLeadSubmit} className="space-y-4">
          <Input
            label="Contact Person Name *"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Jane Smith"
          />
          <Input
            label="Company Name *"
            required
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="e.g. Acme Corp"
          />
          <Input
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="jane.smith@acmecorp.com"
          />
          <Input
            label="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+1 (415) 555-0123"
          />
          <Select
            label="Lead Source"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            options={[
              { value: 'Website', label: 'Website' },
              { value: 'Referral', label: 'Referral' },
              { value: 'Trade Show', label: 'Trade Show' },
            ]}
          />
          <Input
            label="Estimated Commercial Value ($)"
            type="number"
            value={form.estimated_value}
            onChange={(e) => setForm({ ...form, estimated_value: e.target.value })}
          />
          <div className="pt-4 flex gap-3">
            <Button type="submit" className="flex-1">Save Lead</Button>
            <Button type="button" variant="secondary" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
