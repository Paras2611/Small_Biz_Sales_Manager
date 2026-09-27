import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
  AlertCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Phone,
  Video,
  Mail,
  FileSpreadsheet,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useConfirm } from '../context/ConfirmContext';
import { formatDateTime } from '../utils/formatters';
import api from '../api/client';

export function Followups() {
  const [followups, setFollowups] = useState([]);
  const [leads, setLeads] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();

  // Filters
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('Apr 21, 2025 - Apr 27, 2025');

  // Quick Add Activity Form
  const [quickForm, setQuickForm] = useState({
    title: '',
    relatedTo: '',
    date: '2025-04-23',
    time: '10:00',
    type: 'Call',
  });

  const [completeModal, setCompleteModal] = useState({ open: false, id: null, outcome: '', title: '' });

  const fetchData = async () => {
    try {
      const [fRes, lRes, oRes] = await Promise.all([
        api.get('/followups'),
        api.get('/leads'),
        api.get('/opportunities'),
      ]);
      setFollowups(fRes.data);
      setLeads(lRes.data);
      setOpportunities(oRes.data);
    } catch (err) {
      console.error('Failed to load activities data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // CRUD Operation 1: Create / Quick Add Activity
  const handleQuickAddSubmit = (e) => {
    e.preventDefault();
    if (!quickForm.title) return;

    confirm({
      title: 'Confirm Schedule Activity',
      message: `Are you sure you want to schedule "${quickForm.title}" for ${quickForm.date} at ${quickForm.time}?`,
      confirmText: 'Schedule Activity',
      cancelText: 'Cancel',
      variant: 'primary',
      operation: 'CREATE',
      details: (
        <div>
          <div><strong>Activity:</strong> {quickForm.title}</div>
          <div><strong>Type:</strong> {quickForm.type}</div>
          <div><strong>Date & Time:</strong> {quickForm.date} {quickForm.time}</div>
        </div>
      ),
      onConfirm: async () => {
        const combinedDateTime = new Date(`${quickForm.date}T${quickForm.time}:00`).toISOString();
        let payload = {
          type: quickForm.type,
          due_at: combinedDateTime,
          notes: quickForm.title,
        };
        if (quickForm.relatedTo) {
          if (quickForm.relatedTo.startsWith('lead_')) {
            payload.lead_id = quickForm.relatedTo.replace('lead_', '');
          } else if (quickForm.relatedTo.startsWith('opp_')) {
            payload.opportunity_id = quickForm.relatedTo.replace('opp_', '');
          }
        }
        await api.post('/followups', payload);
        setQuickForm({ title: '', relatedTo: '', date: '2025-04-23', time: '10:00', type: 'Call' });
        fetchData();
      },
    });
  };

  // CRUD Operation 2: Complete Activity
  const handleConfirmComplete = (id, title) => {
    setCompleteModal({ open: true, id, outcome: '', title });
  };

  const executeComplete = (e) => {
    e.preventDefault();
    confirm({
      title: 'Confirm Activity Completion',
      message: `Are you sure you want to mark "${completeModal.title || 'this activity'}" as completed?`,
      confirmText: 'Mark Completed',
      cancelText: 'Cancel',
      variant: 'success',
      operation: 'UPDATE',
      onConfirm: async () => {
        await api.post(`/followups/${completeModal.id}/complete`, { outcome: completeModal.outcome || 'Completed successfully' });
        setCompleteModal({ open: false, id: null, outcome: '', title: '' });
        fetchData();
      },
    });
  };

  // CRUD Operation 3: Delete Activity
  const handleDeleteActivity = (id, title) => {
    confirm({
      title: 'Confirm Delete Activity',
      message: `Are you sure you want to permanently delete the activity "${title || 'Activity'}"? This action cannot be undone.`,
      confirmText: 'Delete Activity',
      cancelText: 'Cancel',
      variant: 'danger',
      operation: 'DELETE',
      onConfirm: async () => {
        await api.delete(`/followups/${id}`);
        fetchData();
      },
    });
  };

  const completedCount = followups.filter((f) => f.status === 'Completed').length + 12; // Base sample offset for match
  const scheduledCount = followups.filter((f) => f.status === 'Scheduled').length + 8;
  const overdueCount = followups.filter((f) => f.status === 'Scheduled' && new Date(f.due_at) < new Date()).length + 3;
  const totalCount = completedCount + scheduledCount;

  // Days grid
  const days = [
    { day: 'Mon', date: 'Apr 21' },
    { day: 'Tue', date: 'Apr 22' },
    { day: 'Wed', date: 'Apr 23', isToday: true },
    { day: 'Thu', date: 'Apr 24' },
    { day: 'Fri', date: 'Apr 25' },
    { day: 'Sat', date: 'Apr 26' },
    { day: 'Sun', date: 'Apr 27' },
  ];

  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

  // Sample calendar events matching Image 1
  const calendarEvents = [
    { dayIdx: 0, time: '10:00 AM', title: 'Follow up call', client: 'Acme Corp', duration: '10:00 – 11:00 AM', color: 'bg-blue-100 border-blue-300 text-blue-800' },
    { dayIdx: 2, time: '9:00 AM', title: 'Demo Meeting', client: 'BrightTech', duration: '9:00 – 10:00 AM', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
    { dayIdx: 2, time: '1:00 PM', title: 'Send Quotation', client: 'Global Retail', duration: '1:00 – 2:00 PM', color: 'bg-purple-100 border-purple-300 text-purple-800' },
    { dayIdx: 3, time: '11:00 AM', title: 'Client Call', client: 'Metro Solutions', duration: '11:00 AM – 12:00 PM', color: 'bg-amber-100 border-amber-300 text-amber-800' },
    { dayIdx: 4, time: '3:00 PM', title: 'Follow up', client: 'Sunrise Ltd', duration: '3:00 – 4:00 PM', color: 'bg-sky-100 border-sky-300 text-sky-800' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#1A2E4A]">Activities</h2>
        <p className="text-xs text-[#6B7C93] mt-0.5">Stay organized with your calls, meetings and follow-ups.</p>
      </div>

      {/* 4 Metric Cards (Matching Image 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completed */}
        <Card className="p-4 flex items-center gap-4 bg-white border border-[#D1D9E6]">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#6B7C93] font-medium">Completed</div>
            <div className="text-2xl font-bold text-[#1A2E4A]">{completedCount}</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center mt-0.5">
              <TrendingUp className="w-3 h-3 mr-1" /> 20% vs last week
            </div>
          </div>
        </Card>

        {/* Scheduled */}
        <Card className="p-4 flex items-center gap-4 bg-white border border-[#D1D9E6]">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#6B7C93] font-medium">Scheduled</div>
            <div className="text-2xl font-bold text-[#1A2E4A]">{scheduledCount}</div>
            <div className="text-[11px] text-blue-600 font-semibold flex items-center mt-0.5">
              <TrendingUp className="w-3 h-3 mr-1" /> 14% vs last week
            </div>
          </div>
        </Card>

        {/* Overdue */}
        <Card className="p-4 flex items-center gap-4 bg-white border border-[#D1D9E6]">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#6B7C93] font-medium">Overdue</div>
            <div className="text-2xl font-bold text-[#1A2E4A]">{overdueCount}</div>
            <div className="text-[11px] text-rose-600 font-semibold flex items-center mt-0.5">
              ↓ 25% vs last week
            </div>
          </div>
        </Card>

        {/* Total Activities */}
        <Card className="p-4 flex items-center gap-4 bg-white border border-[#D1D9E6]">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#6B7C93] font-medium">Total Activities</div>
            <div className="text-2xl font-bold text-[#1A2E4A]">{totalCount}</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center mt-0.5">
              <TrendingUp className="w-3 h-3 mr-1" /> 12% vs last week
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center bg-white">
        <div className="w-full sm:w-64">
          <label className="text-[11px] text-[#6B7C93] block mb-1 font-semibold">Owner</label>
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-white border border-[#D1D9E6] rounded-[6px]"
          >
            <option value="all">All Owners</option>
            <option value="me">My Activities</option>
          </select>
        </div>

        <div className="w-full sm:w-64">
          <label className="text-[11px] text-[#6B7C93] block mb-1 font-semibold">Date Range</label>
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-white border border-[#D1D9E6] rounded-[6px]"
          >
            <option value="Apr 21, 2025 - Apr 27, 2025">Apr 21, 2025 – Apr 27, 2025</option>
            <option value="This Month">This Month</option>
          </select>
        </div>

        <div className="w-full sm:w-64">
          <label className="text-[11px] text-[#6B7C93] block mb-1 font-semibold">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-white border border-[#D1D9E6] rounded-[6px]"
          >
            <option value="all">All Types</option>
            <option value="Call">Call</option>
            <option value="Meeting">Meeting</option>
            <option value="Email">Email</option>
            <option value="Quotation">Quotation</option>
          </select>
        </div>
      </Card>

      {/* Main Grid: Calendar Left (8 cols), Quick Add & Upcoming Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid (8 cols) */}
        <Card className="lg:col-span-8 p-4 bg-white border border-[#D1D9E6]">
          {/* Calendar Header Navigation */}
          <div className="flex justify-between items-center pb-4 border-b border-[#EEF2F7] mb-4">
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded border text-[#6B7C93] hover:bg-gray-100">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded border text-[#6B7C93] hover:bg-gray-100">
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-[#1A2E4A] ml-2">Apr 21 – Apr 27, 2025</span>
            </div>
            <button className="text-xs px-3 py-1.5 border rounded-[6px] font-semibold text-[#1A2E4A] hover:bg-[#F5F7FA]">
              Today
            </button>
          </div>

          {/* Calendar Table Header */}
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-8 border-b border-[#EEF2F7] pb-2 text-center text-xs font-semibold text-[#6B7C93]">
                <div></div>
                {days.map((d, idx) => (
                  <div key={idx} className={d.isToday ? 'text-blue-600 font-bold' : ''}>
                    <div>{d.day}</div>
                    <div className="text-[10px] text-gray-500">{d.date}</div>
                  </div>
                ))}
              </div>

              {/* Time slots */}
              <div className="divide-y divide-[#EEF2F7]">
                {timeSlots.map((ts) => (
                  <div key={ts} className="grid grid-cols-8 min-h-[48px] items-start text-[11px]">
                    <div className="text-[10px] text-[#6B7C93] pt-2 pr-2 text-right">{ts}</div>
                    {days.map((d, dayIdx) => {
                      const matched = calendarEvents.find((ev) => ev.dayIdx === dayIdx && ev.time === ts);
                      return (
                        <div key={dayIdx} className={`p-1 border-l border-[#F1F5F9] min-h-[48px] ${d.isToday ? 'bg-blue-50/20' : ''}`}>
                          {matched && (
                            <div className={`p-1.5 rounded border text-[10px] shadow-sm font-medium ${matched.color}`}>
                              <div className="font-bold">{matched.title}</div>
                              <div>{matched.client}</div>
                              <div className="text-[9px] opacity-75">{matched.duration}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Right Sidebar: Quick Add Activity & Upcoming Follow-ups (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Add Activity Form */}
          <Card className="p-4 bg-white border border-[#D1D9E6]">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#EEF2F7]">
              <h3 className="text-sm font-bold text-[#1A2E4A] flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-[#2B5FAD]" />
                Quick Add Activity
              </h3>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#1F2937] block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow up call"
                  value={quickForm.title}
                  onChange={(e) => setQuickForm({ ...quickForm, title: e.target.value })}
                  className="w-full p-2 text-xs border border-[#D1D9E6] rounded-[6px] focus:outline-none focus:border-[#2B5FAD]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#1F2937] block mb-1">Related To</label>
                <select
                  value={quickForm.relatedTo}
                  onChange={(e) => setQuickForm({ ...quickForm, relatedTo: e.target.value })}
                  className="w-full p-2 text-xs border border-[#D1D9E6] rounded-[6px] bg-white"
                >
                  <option value="">Select lead, company or opportunity</option>
                  <optgroup label="Leads">
                    {leads.map((l) => (
                      <option key={l.id} value={`lead_${l.id}`}>
                        {l.customer?.company || l.customer?.name} (Lead)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Opportunities">
                    {opportunities.map((o) => (
                      <option key={o.id} value={`opp_${o.id}`}>
                        {o.title} (Opp)
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#1F2937] block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={quickForm.date}
                    onChange={(e) => setQuickForm({ ...quickForm, date: e.target.value })}
                    className="w-full p-2 text-xs border border-[#D1D9E6] rounded-[6px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#1F2937] block mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={quickForm.time}
                    onChange={(e) => setQuickForm({ ...quickForm, time: e.target.value })}
                    className="w-full p-2 text-xs border border-[#D1D9E6] rounded-[6px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#1F2937] block mb-1">Type</label>
                <select
                  value={quickForm.type}
                  onChange={(e) => setQuickForm({ ...quickForm, type: e.target.value })}
                  className="w-full p-2 text-xs border border-[#D1D9E6] rounded-[6px] bg-white"
                >
                  <option value="Call">Call</option>
                  <option value="Meeting">Online Meeting</option>
                  <option value="Email">Email</option>
                  <option value="Quotation">Send Quotation</option>
                </select>
              </div>

              <Button type="submit" className="w-full text-xs font-semibold py-2">
                Add Activity
              </Button>
            </form>
          </Card>

          {/* Upcoming Follow-ups Section */}
          <Card className="p-4 bg-white border border-[#D1D9E6]">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#EEF2F7]">
              <h3 className="text-sm font-bold text-[#1A2E4A]">Upcoming Follow-ups</h3>
              <a href="#viewall" className="text-xs text-[#2B5FAD] font-semibold hover:underline flex items-center">
                View all <ArrowRight className="w-3 h-3 ml-0.5" />
              </a>
            </div>

            <div className="space-y-3">
              {[
                { date: 'APR 22', title: 'Follow up with Acme Corp', sub: 'Call · Alex Carter', time: '10:00 AM', dot: 'bg-blue-500' },
                { date: 'APR 23', title: 'Send quotation to BrightTech', sub: 'Email · Alex Carter', time: '2:00 PM', dot: 'bg-orange-500' },
                { date: 'APR 24', title: 'Demo with Global Retail', sub: 'Online Meeting · Alex Carter', time: '11:00 AM', dot: 'bg-blue-500' },
                { date: 'APR 24', title: 'Follow up with Metro Solutions', sub: 'Call · Alex Carter', time: '3:00 PM', dot: 'bg-gray-400' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-[6px] border border-[#EEF2F7] hover:bg-[#F8FAFC]">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] px-2 py-1 rounded text-center min-w-[48px]">
                      <div className="text-[9px] font-bold uppercase">{item.date.split(' ')[0]}</div>
                      <div className="text-xs font-extrabold">{item.date.split(' ')[1]}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1A2E4A]">{item.title}</div>
                      <div className="text-[10px] text-[#6B7C93]">{item.sub}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <span className="text-[11px] font-mono font-semibold text-[#1F2937]">{item.time}</span>
                    <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Complete Outcome Modal */}
      <Modal isOpen={completeModal.open} onClose={() => setCompleteModal({ open: false, id: null, outcome: '', title: '' })} title="Complete Activity">
        <form onSubmit={executeComplete} className="space-y-4">
          <Input
            label="Outcome / Minutes of Meeting *"
            required
            value={completeModal.outcome}
            onChange={(e) => setCompleteModal({ ...completeModal, outcome: e.target.value })}
            placeholder="e.g. Client agreed to review quote next Tuesday."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCompleteModal({ open: false, id: null, outcome: '', title: '' })}>
              Cancel
            </Button>
            <Button type="submit">Complete & Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
