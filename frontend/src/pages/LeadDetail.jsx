import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  CalendarPlus,
  Briefcase,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useConfirm } from '../context/ConfirmContext';
import { formatDate, formatDateTime, formatCurrency } from '../utils/formatters';
import api from '../api/client';

const STAGES = ['New', 'Contacted', 'Qualified', 'Opportunity'];

export function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI State
  const [aiPriority, setAiPriority] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiNextAction, setAiNextAction] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Modals
  const [isQualifyOpen, setIsQualifyOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isFollowupOpen, setIsFollowupOpen] = useState(false);

  // Form states
  const [qualifyForm, setQualifyForm] = useState({
    budget_confirmed: true,
    decision_maker_identified: true,
    timeline_months: 3,
    notes: 'Budget verified against standard CRM implementation package.',
  });
  const [convertForm, setConvertForm] = useState({
    title: '',
    amount: 0,
    close_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
  });
  const [followupForm, setFollowupForm] = useState({
    type: 'Call',
    due_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    notes: '',
  });

  const fetchLeadData = async () => {
    try {
      const [lRes, fRes] = await Promise.all([
        api.get(`/leads/${id}`),
        api.get('/followups', { params: { lead_id: id } }),
      ]);
      setLead(lRes.data);
      setFollowups(fRes.data);
      setConvertForm((prev) => ({
        ...prev,
        title: `${lRes.data.customer?.company || 'Client'} Implementation`,
        amount: Number(lRes.data.estimated_value) || 100000,
      }));
    } catch (err) {
      console.error('Failed to load lead details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiInsights = async () => {
    setAiLoading(true);
    try {
      const [pRes, sRes, nRes] = await Promise.all([
        api.post('/ai/lead-priority', { lead_id: id }),
        api.post('/ai/lead-summary', { lead_id: id }),
        api.post('/ai/next-action', { lead_id: id }),
      ]);
      setAiPriority(pRes.data);
      setAiSummary(sRes.data);
      setAiNextAction(nRes.data);
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadData();
    fetchAiInsights();
  }, [id]);

  const confirm = useConfirm();

  const handleQualify = async (e) => {
    e.preventDefault();
    confirm({
      title: 'Confirm Lead Qualification',
      message: 'Are you sure you want to mark this lead as Qualified?',
      confirmText: 'Qualify Lead',
      cancelText: 'Cancel',
      variant: 'success',
      operation: 'UPDATE',
      onConfirm: async () => {
        await api.post(`/leads/${id}/qualify`, qualifyForm);
        setIsQualifyOpen(false);
        fetchLeadData();
        fetchAiInsights();
      },
    });
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    confirm({
      title: 'Confirm Opportunity Conversion',
      message: `Are you sure you want to convert this lead into deal opportunity "${convertForm.title}" valued at ${formatCurrency(convertForm.amount)}?`,
      confirmText: 'Convert Deal',
      cancelText: 'Cancel',
      variant: 'primary',
      operation: 'CONVERT',
      onConfirm: async () => {
        await api.post(`/leads/${id}/convert-opportunity`, convertForm);
        setIsConvertOpen(false);
        navigate(`/opportunities`);
      },
    });
  };

  const handleCreateFollowup = async (e) => {
    e.preventDefault();
    confirm({
      title: 'Confirm Schedule Follow-up',
      message: `Schedule a ${followupForm.type} for this lead on ${followupForm.due_at}?`,
      confirmText: 'Schedule Follow-up',
      cancelText: 'Cancel',
      variant: 'primary',
      operation: 'CREATE',
      onConfirm: async () => {
        await api.post('/followups', {
          lead_id: id,
          type: followupForm.type,
          due_at: new Date(followupForm.due_at).toISOString(),
          notes: followupForm.notes,
        });
        setIsFollowupOpen(false);
        setFollowupForm({ type: 'Call', due_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16), notes: '' });
        fetchLeadData();
      },
    });
  };

  if (loading || !lead) {
    return <div className="p-8 text-center text-sm text-[#6B7C93]">Loading lead profile...</div>;
  }

  const currentStageIndex = lead.status === 'Qualified' ? 2 : lead.status === 'Contacted' ? 1 : 0;

  return (
    <div className="space-y-6">
      {/* Back and Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link to="/leads" className="p-2 bg-white border border-[#D1D9E6] rounded-[6px] hover:bg-[#EEF2F7]">
            <ArrowLeft className="w-4 h-4 text-[#1F2937]" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#1A2E4A]">{lead.customer?.company}</h2>
              <Badge status={lead.status} />
            </div>
            <p className="text-xs text-[#6B7C93]">Contact: {lead.customer?.name} · Source: {lead.source}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {lead.status !== 'Qualified' && (
            <Button onClick={() => setIsQualifyOpen(true)} variant="secondary">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-[#10B981]" />
              Qualify Lead
            </Button>
          )}
          <Button
            onClick={() => setIsConvertOpen(true)}
            disabled={lead.status !== 'Qualified'}
            title={lead.status !== 'Qualified' ? 'Lead must be qualified first' : ''}
          >
            <Briefcase className="w-4 h-4 mr-1.5" />
            Convert to Opportunity
          </Button>
        </div>
      </div>

      {/* Stage Progression Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          {STAGES.map((st, i) => (
            <div key={st} className="flex-1 flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i <= currentStageIndex
                      ? 'bg-[#2B5FAD] text-white'
                      : 'bg-[#EEF2F7] text-[#6B7C93]'
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-xs font-semibold ${i <= currentStageIndex ? 'text-[#1A2E4A]' : 'text-[#6B7C93]'}`}>
                  {st}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-3 rounded ${
                    i < currentStageIndex ? 'bg-[#2B5FAD]' : 'bg-[#E2E8F0]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 2-Column Split: 65% Left, 35% Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (65% = 8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Lead Information */}
          <Card>
            <CardHeader title="Lead Profile & Commercial Fit" subtitle="Key contact attributes and requirements" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[#6B7C93] block">Contact Email</span>
                <span className="font-semibold text-[#1F2937]">{lead.customer?.email || 'not available'}</span>
              </div>
              <div>
                <span className="text-[#6B7C93] block">Phone Number</span>
                <span className="font-semibold text-[#1F2937]">{lead.customer?.phone || 'not available'}</span>
              </div>
              <div>
                <span className="text-[#6B7C93] block">Estimated Value</span>
                <span className="font-bold text-[#10B981] font-mono text-sm">{formatCurrency(lead.estimated_value)}</span>
              </div>
              <div>
                <span className="text-[#6B7C93] block">Assigned Owner</span>
                <span className="font-semibold text-[#1F2937]">{lead.owner?.name || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-[#6B7C93] block">Lead Score</span>
                <span className="font-semibold text-[#2B5FAD]">{lead.score}/100</span>
              </div>
              <div>
                <span className="text-[#6B7C93] block">Registered On</span>
                <span className="font-semibold text-[#1F2937]">{formatDate(lead.created_at)}</span>
              </div>
            </div>

            {lead.qualification_notes && (
              <div className="mt-4 pt-4 border-t border-[#EEF2F7]">
                <span className="text-xs font-semibold text-[#1A2E4A] block mb-1">Qualification Checklist Notes:</span>
                <p className="text-xs text-[#4B5563] bg-[#F5F7FA] p-3 rounded-[6px]">{lead.qualification_notes}</p>
              </div>
            )}
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader
              title="Interaction Timeline & Follow-ups"
              subtitle="Scheduled calls, demos, and recorded outcomes"
              action={
                <Button size="sm" onClick={() => setIsFollowupOpen(true)}>
                  <CalendarPlus className="w-3.5 h-3.5 mr-1" />
                  Log Follow-up
                </Button>
              }
            />
            <div className="space-y-3">
              {followups.length === 0 ? (
                <p className="text-xs text-[#6B7C93] py-4 text-center">No interactions logged yet.</p>
              ) : (
                followups.map((f) => (
                  <div key={f.id} className="p-3 rounded-[6px] border border-[#D1D9E6] flex justify-between items-start bg-white">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1A2E4A]">{f.type}</span>
                        <Badge status={f.status} />
                      </div>
                      <p className="text-xs text-[#4B5563] mt-1">{f.notes || 'No specific agenda recorded'}</p>
                      {f.outcome && (
                        <p className="text-[11px] text-[#059669] font-medium mt-1">Outcome: {f.outcome}</p>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-[#6B7C93]">{formatDateTime(f.due_at)}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (35% = 4 cols) - AI Panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-gradient-to-b from-[#EFF6FF] to-white border-[#BFDBFE]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DBEAFE] mb-3">
              <div className="flex items-center gap-1.5 text-[#2B5FAD]">
                <Sparkles className="w-4 h-4" />
                <h3 className="text-sm font-bold">AI Sales Assistant</h3>
              </div>
              <button onClick={fetchAiInsights} disabled={aiLoading} className="text-[#2B5FAD] hover:rotate-180 transition-transform">
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Priority Assessment */}
            <div className="mb-4">
              <span className="text-xs font-semibold text-[#1A2E4A] block mb-1">Priority Categorization:</span>
              {aiPriority ? (
                <div className="p-2.5 bg-white rounded-[6px] border border-[#BFDBFE]">
                  <div className="flex justify-between items-center mb-1.5">
                    <Badge status={aiPriority.priority} label={`${aiPriority.priority} Priority`} />
                    <span className="text-[10px] text-[#6B7C93]">Advisory only</span>
                  </div>
                  <ul className="text-[11px] text-[#4B5563] space-y-1 list-disc list-inside">
                    {aiPriority.evidence.map((pt, idx) => (
                      <li key={idx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="h-16 animate-pulse bg-white/60 rounded" />
              )}
            </div>

            {/* Context Summary */}
            <div className="mb-4">
              <span className="text-xs font-semibold text-[#1A2E4A] block mb-1">Contextual Summary:</span>
              {aiSummary ? (
                <div className="p-2.5 bg-white rounded-[6px] border border-[#BFDBFE] text-[11px] text-[#4B5563] space-y-1">
                  {aiSummary.points.map((p, idx) => (
                    <div key={idx}>{p}</div>
                  ))}
                </div>
              ) : (
                <div className="h-16 animate-pulse bg-white/60 rounded" />
              )}
            </div>

            {/* Next-Best-Action */}
            <div>
              <span className="text-xs font-semibold text-[#1A2E4A] block mb-1">Next-Best-Action:</span>
              {aiNextAction ? (
                <div className="p-2.5 bg-white rounded-[6px] border border-[#BFDBFE]">
                  <p className="text-xs font-bold text-[#1A2E4A]">{aiNextAction.recommended_action}</p>
                  <p className="text-[11px] text-[#6B7C93] mt-1">{aiNextAction.rationale}</p>
                  {aiNextAction.suggested_message && (
                    <div className="mt-2 p-2 bg-[#F8FAFC] rounded border border-[#E2E8F0] text-[11px] font-mono text-[#334155]">
                      "{aiNextAction.suggested_message}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-16 animate-pulse bg-white/60 rounded" />
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Qualification Modal */}
      <Modal isOpen={isQualifyOpen} onClose={() => setIsQualifyOpen(false)} title="Lead Qualification Assessment">
        <form onSubmit={handleQualify} className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-[#1F2937]">
              <input
                type="checkbox"
                checked={qualifyForm.budget_confirmed}
                onChange={(e) => setQualifyForm({ ...qualifyForm, budget_confirmed: e.target.checked })}
              />
              Budget confirmed and allocated
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-[#1F2937]">
              <input
                type="checkbox"
                checked={qualifyForm.decision_maker_identified}
                onChange={(e) => setQualifyForm({ ...qualifyForm, decision_maker_identified: e.target.checked })}
              />
              Key decision maker identified & engaged
            </label>
          </div>
          <Input
            label="Implementation Timeline (Months)"
            type="number"
            min={1}
            max={24}
            value={qualifyForm.timeline_months}
            onChange={(e) => setQualifyForm({ ...qualifyForm, timeline_months: Number(e.target.value) })}
          />
          <Input
            label="Qualification Assessment Notes"
            required
            value={qualifyForm.notes}
            onChange={(e) => setQualifyForm({ ...qualifyForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsQualifyOpen(false)}>Cancel</Button>
            <Button type="submit">Mark as Qualified</Button>
          </div>
        </form>
      </Modal>

      {/* Convert to Opportunity Modal */}
      <Modal isOpen={isConvertOpen} onClose={() => setIsConvertOpen(false)} title="Convert Lead to Opportunity">
        <form onSubmit={handleConvert} className="space-y-4">
          <Input
            label="Opportunity Title *"
            required
            value={convertForm.title}
            onChange={(e) => setConvertForm({ ...convertForm, title: e.target.value })}
          />
          <Input
            label="Estimated Commercial Value (₹) *"
            type="number"
            required
            value={convertForm.amount}
            onChange={(e) => setConvertForm({ ...convertForm, amount: Number(e.target.value) })}
          />
          <Input
            label="Target Closing Date *"
            type="date"
            required
            value={convertForm.close_date}
            onChange={(e) => setConvertForm({ ...convertForm, close_date: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsConvertOpen(false)}>Cancel</Button>
            <Button type="submit">Create Opportunity</Button>
          </div>
        </form>
      </Modal>

      {/* Log Follow-up Modal */}
      <Modal isOpen={isFollowupOpen} onClose={() => setIsFollowupOpen(false)} title="Log Follow-up Activity">
        <form onSubmit={handleCreateFollowup} className="space-y-4">
          <Input
            label="Activity Type"
            value={followupForm.type}
            onChange={(e) => setFollowupForm({ ...followupForm, type: e.target.value })}
            placeholder="Call, Email, Demo, Pricing Discussion"
          />
          <Input
            label="Scheduled Date and Time"
            type="datetime-local"
            value={followupForm.due_at}
            onChange={(e) => setFollowupForm({ ...followupForm, due_at: e.target.value })}
          />
          <Input
            label="Notes / Agenda"
            value={followupForm.notes}
            onChange={(e) => setFollowupForm({ ...followupForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsFollowupOpen(false)}>Cancel</Button>
            <Button type="submit">Save Follow-up</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
