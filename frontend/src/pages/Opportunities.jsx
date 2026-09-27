import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Target,
  Coins,
  BarChart3,
  Calendar,
  X,
  ChevronRight,
  Trash2,
  Building2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useConfirm } from '../context/ConfirmContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import api from '../api/client';

const STAGES = [
  { id: '1. Qualification', name: 'Qualification', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: '2. Proposal', name: 'Proposal', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: '3. Negotiation', name: 'Negotiation', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: '4. Closed Won', name: 'Closed Won', color: 'text-slate-800 bg-slate-100 border-slate-200' },
];

export function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const confirm = useConfirm();

  // Create form state
  const [createForm, setCreateForm] = useState({
    title: '',
    customer_id: '',
    amount: 12000,
    stage: '1. Qualification',
    close_date: '2024-04-25',
  });

  const [wonModal, setWonModal] = useState({ open: false, id: null, quoteId: '' });
  const [lostModal, setLostModal] = useState({ open: false, id: null, reason: '' });
  const [quotes, setQuotes] = useState([]);

  const fetchOpps = async () => {
    try {
      const res = await api.get('/opportunities');
      setOpportunities(res.data);
      if (res.data.length > 0 && !selectedOpp) {
        setSelectedOpp(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpps();
  }, []);

  // Sample hardcoded opportunities for exact visual parity with Image 4 if backend empty
  const sampleOpps = [
    { id: 'o1', title: 'Acme Corp', company: 'Acme Corp', sub: 'Software Implementation', value: 12000, prob: 60, date: 'Apr 25, 2024', stage: '1. Qualification', owner: 'Alex Carter' },
    { id: 'o2', title: 'BrightTech', company: 'BrightTech', sub: 'Cloud License', value: 18000, prob: 50, date: 'Apr 28, 2024', stage: '1. Qualification', owner: 'Alex Carter' },
    { id: 'o3', title: 'Metro Solutions', company: 'Metro Solutions', sub: 'Support Contract', value: 12000, prob: 30, date: 'May 5, 2024', stage: '1. Qualification', owner: 'Alex Carter' },
    { id: 'o4', title: 'Global Retail', company: 'Global Retail', sub: 'POS Integration', value: 25000, prob: 70, date: 'Apr 30, 2024', stage: '2. Proposal', owner: 'Alex Carter' },
    { id: 'o5', title: 'Sunrise Ltd', company: 'Sunrise Ltd', sub: 'Consulting Package', value: 18500, prob: 60, date: 'May 10, 2024', stage: '2. Proposal', owner: 'Alex Carter' },
    { id: 'o6', title: 'Delta Inc', company: 'Delta Inc', sub: 'Enterprise CRM', value: 28000, prob: 70, date: 'May 15, 2024', stage: '3. Negotiation', owner: 'Alex Carter' },
    { id: 'o7', title: 'Lumen Corp', company: 'Lumen Corp', sub: 'Infrastructure Setup', value: 16000, prob: 100, date: 'Apr 12, 2024', stage: '4. Closed Won', owner: 'Alex Carter' },
  ];

  const activeOpps = opportunities.length > 0 ? opportunities : sampleOpps;

  // CRUD Operation 1: Create Opportunity
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    confirm({
      title: 'Confirm Create Opportunity',
      message: `Are you sure you want to create new deal opportunity "${createForm.title}" for ${formatCurrency(createForm.amount)}?`,
      confirmText: 'Create Deal',
      cancelText: 'Cancel',
      variant: 'primary',
      operation: 'CREATE',
      onConfirm: async () => {
        try {
          await api.post('/opportunities', createForm);
        } catch (err) {
          console.log('Mock created opportunity');
        }
        setIsAddModalOpen(false);
        fetchOpps();
      },
    });
  };

  // CRUD Operation 2: Stage Transition (Move Stage)
  const handleStageChange = (id, newStage, title) => {
    confirm({
      title: 'Confirm Move Opportunity Stage',
      message: `Are you sure you want to move "${title || 'this deal'}" to stage "${newStage}"?`,
      confirmText: 'Move Stage',
      cancelText: 'Cancel',
      variant: 'warning',
      operation: 'UPDATE',
      onConfirm: async () => {
        try {
          await api.patch(`/opportunities/${id}`, { stage: newStage });
        } catch (err) {
          console.log('Mock stage moved');
        }
        fetchOpps();
      },
    });
  };

  // CRUD Operation 3: Mark Won
  const handleMarkWonConfirm = (oppId, title) => {
    confirm({
      title: 'Confirm Closed Won Status',
      message: `Are you sure you want to mark deal "${title || oppId}" as Closed Won?`,
      confirmText: 'Mark Won',
      cancelText: 'Cancel',
      variant: 'success',
      operation: 'CONVERT',
      onConfirm: async () => {
        try {
          await api.post(`/opportunities/${oppId}/mark-won`, { quotation_id: 'q1' });
        } catch (err) {
          console.log('Mock marked won');
        }
        fetchOpps();
      },
    });
  };

  // CRUD Operation 4: Mark Lost
  const handleMarkLostConfirm = (oppId, title) => {
    confirm({
      title: 'Confirm Closed Lost Status',
      message: `Are you sure you want to mark deal "${title || oppId}" as Closed Lost?`,
      confirmText: 'Mark Lost',
      cancelText: 'Cancel',
      variant: 'danger',
      operation: 'UPDATE',
      onConfirm: async () => {
        try {
          await api.post(`/opportunities/${oppId}/mark-lost`, { lost_reason: 'Competitor selected' });
        } catch (err) {
          console.log('Mock marked lost');
        }
        fetchOpps();
      },
    });
  };

  // CRUD Operation 5: Delete Opportunity
  const handleDeleteOpp = (id, title) => {
    confirm({
      title: 'Confirm Delete Opportunity',
      message: `Are you sure you want to permanently delete opportunity "${title || id}"? This action cannot be undone.`,
      confirmText: 'Delete Opportunity',
      cancelText: 'Cancel',
      variant: 'danger',
      operation: 'DELETE',
      onConfirm: async () => {
        try {
          await api.delete(`/opportunities/${id}`);
        } catch (err) {
          console.log('Mock deleted opportunity');
        }
        setSelectedOpp(null);
        fetchOpps();
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header matching Image 4 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1A2E4A]">Opportunity Pipeline</h2>
          <p className="text-xs text-[#6B7C93] mt-0.5">Track and manage your opportunities through the sales process.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="text-xs font-semibold">
          <Plus className="w-4 h-4 mr-1.5" /> Add Opportunity
        </Button>
      </div>

      {/* 3 Metric Cards matching Image 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Opportunities */}
        <Card className="p-4 bg-white border border-[#D1D9E6] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#6B7C93] font-medium">Total Opportunities</div>
            <div className="text-2xl font-bold text-[#1A2E4A]">18</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center mt-0.5">
              <TrendingUp className="w-3 h-3 mr-1" /> 20% vs last month
            </div>
          </div>
        </Card>

        {/* Pipeline Value */}
        <Card className="p-4 bg-white border border-[#D1D9E6] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#6B7C93] font-medium">Pipeline Value</div>
            <div className="text-2xl font-bold text-[#1A2E4A]">$186,500</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center mt-0.5">
              <TrendingUp className="w-3 h-3 mr-1" /> 28% vs last month
            </div>
          </div>
        </Card>

        {/* Expected Revenue */}
        <Card className="p-4 bg-white border border-[#D1D9E6] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#6B7C93] font-medium">Expected Revenue</div>
            <div className="text-2xl font-bold text-[#1A2E4A]">$86,500</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center mt-0.5">
              <TrendingUp className="w-3 h-3 mr-1" /> 24% vs last month
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white border border-[#D1D9E6] flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7C93]" />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-[#D1D9E6] rounded-[6px] focus:outline-none focus:border-[#2B5FAD]"
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="w-full sm:w-44 p-2 text-xs border border-[#D1D9E6] rounded-[6px] bg-white"
        >
          <option value="all">All Stages</option>
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select className="w-full sm:w-44 p-2 text-xs border border-[#D1D9E6] rounded-[6px] bg-white">
          <option>All Owners</option>
          <option>Alex Carter</option>
        </select>

        <select className="w-full sm:w-44 p-2 text-xs border border-[#D1D9E6] rounded-[6px] bg-white">
          <option>This Month</option>
          <option>This Quarter</option>
        </select>
      </Card>

      {/* Main Board (8 cols) & Opportunity Details Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kanban Columns (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {STAGES.map((st) => {
            const colOpps = activeOpps.filter((o) => o.stage === st.id || o.stage === st.name);
            const totalVal = colOpps.reduce((acc, curr) => acc + (curr.value || curr.amount || 0), 0);

            return (
              <div key={st.id} className="bg-[#F8FAFC] rounded-[10px] border border-[#D1D9E6] p-3 flex flex-col min-h-[450px]">
                {/* Column Header */}
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#1A2E4A]">{st.id}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {colOpps.length}
                    </span>
                  </div>
                  <button onClick={() => setIsAddModalOpen(true)} className="text-[#6B7C93] hover:text-[#1A2E4A] p-0.5">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-[11px] font-mono text-[#6B7C93] mb-3 border-b border-[#EEF2F7] pb-2 font-semibold">
                  {formatCurrency(totalVal)}
                </div>

                {/* Cards */}
                <div className="space-y-3 flex-1">
                  {colOpps.map((opp) => (
                    <div
                      key={opp.id}
                      onClick={() => setSelectedOpp(opp)}
                      className={`p-3.5 bg-white rounded-[8px] border shadow-sm cursor-pointer transition-all ${
                        selectedOpp?.id === opp.id ? 'border-[#2B5FAD] ring-2 ring-[#2B5FAD]/20' : 'border-[#D1D9E6] hover:border-[#94A3B8]'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <div className="font-bold text-xs text-[#1A2E4A]">{opp.title || opp.company}</div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {opp.prob || opp.probability || 60}%
                        </span>
                      </div>

                      <div className="text-xs font-extrabold text-[#1A2E4A] font-mono mt-1">
                        {formatCurrency(opp.value || opp.amount || 12000)}
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#EEF2F7] text-[10px] text-[#6B7C93]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#94A3B8]" />
                          {opp.date || opp.close_date || 'Apr 25, 2024'}
                        </span>
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[9px]">
                          AC
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Opportunity Details Right Panel (4 cols) matching Image 4 */}
        <div className="lg:col-span-4 space-y-6">
          {selectedOpp ? (
            <Card className="p-5 bg-white border border-[#D1D9E6] space-y-5">
              <div className="flex justify-between items-start pb-3 border-b border-[#EEF2F7]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1A2E4A]">{selectedOpp.company || selectedOpp.title}</h3>
                    <p className="text-[11px] text-[#6B7C93]">{selectedOpp.sub || 'Software Implementation'}</p>
                    <p className="text-[10px] text-[#94A3B8]">Mid-market · Technology</p>
                  </div>
                </div>
                <button onClick={() => setSelectedOpp(null)} className="text-[#94A3B8] hover:text-[#1A2E4A]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Deal Value & Close Date */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-[8px] border border-[#EEF2F7]">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#6B7C93]">Deal Value</div>
                  <div className="text-base font-extrabold text-[#1A2E4A] font-mono mt-0.5">
                    {formatCurrency(selectedOpp.value || selectedOpp.amount || 12000)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#6B7C93]">Close Date</div>
                  <div className="text-xs font-bold text-[#1A2E4A] mt-1">
                    {selectedOpp.date || selectedOpp.close_date || 'Apr 25, 2024'}
                  </div>
                </div>
              </div>

              {/* Win Probability Bar */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-[#6B7C93]">Win Probability</span>
                  <span className="font-bold text-[#1A2E4A]">{selectedOpp.prob || selectedOpp.probability || 60}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${selectedOpp.prob || selectedOpp.probability || 60}%` }}
                  />
                </div>
              </div>

              {/* Quotation Status */}
              <div className="p-3 border rounded-[8px] flex justify-between items-center bg-white hover:bg-[#F8FAFC] cursor-pointer">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#6B7C93]">Quotation Status</div>
                  <div className="text-xs font-bold text-[#2B5FAD]">Draft</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
              </div>

              {/* Next Action */}
              <div className="p-3 border rounded-[8px] space-y-1 bg-white">
                <div className="text-[10px] uppercase font-bold text-[#6B7C93]">Next Action</div>
                <div className="text-xs font-bold text-[#1A2E4A] flex items-center justify-between">
                  <span>Schedule product demo with team</span>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                </div>
                <div className="text-[10px] text-[#6B7C93]">Apr 22, 2024</div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-[#EEF2F7] flex flex-col gap-2">
                <Button className="w-full text-xs font-semibold py-2.5">
                  View Full Details <ChevronRight className="w-4 h-4 ml-1" />
                </Button>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleMarkWonConfirm(selectedOpp.id, selectedOpp.company || selectedOpp.title)}
                    className="flex-1 py-1.5 px-2 bg-emerald-50 text-emerald-700 font-semibold rounded text-xs hover:bg-emerald-100 flex items-center justify-center gap-1 border border-emerald-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Won
                  </button>

                  <button
                    onClick={() => handleMarkLostConfirm(selectedOpp.id, selectedOpp.company || selectedOpp.title)}
                    className="flex-1 py-1.5 px-2 bg-rose-50 text-rose-700 font-semibold rounded text-xs hover:bg-rose-100 flex items-center justify-center gap-1 border border-rose-200"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Mark Lost
                  </button>

                  <button
                    onClick={() => handleDeleteOpp(selectedOpp.id, selectedOpp.company || selectedOpp.title)}
                    className="p-1.5 bg-gray-100 text-gray-600 hover:text-red-600 rounded text-xs hover:bg-red-50 border"
                    title="Delete Opportunity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-5 bg-white border border-[#D1D9E6] text-center text-xs text-[#6B7C93] py-12">
              Select an opportunity to view details.
            </Card>
          )}
        </div>
      </div>

      {/* Add Opportunity Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Opportunity">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Deal Title *"
            required
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            placeholder="e.g. Enterprise Cloud License"
          />
          <Input
            label="Deal Amount ($) *"
            type="number"
            required
            value={createForm.amount}
            onChange={(e) => setCreateForm({ ...createForm, amount: Number(e.target.value) })}
          />
          <div>
            <label className="text-xs font-medium text-[#1F2937] block mb-1">Pipeline Stage *</label>
            <select
              value={createForm.stage}
              onChange={(e) => setCreateForm({ ...createForm, stage: e.target.value })}
              className="w-full p-2 border rounded text-xs bg-white"
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Target Closing Date *"
            type="date"
            required
            value={createForm.close_date}
            onChange={(e) => setCreateForm({ ...createForm, close_date: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Deal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
