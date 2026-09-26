import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, LayoutGrid, List, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { formatCurrency, formatDate } from '../utils/formatters';
import api from '../api/client';

const STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closing'];

export function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [loading, setLoading] = useState(true);

  // Won / Lost Modals
  const [wonModal, setWonModal] = useState({ open: false, id: null, quoteId: '' });
  const [lostModal, setLostModal] = useState({ open: false, id: null, reason: '' });
  const [quotes, setQuotes] = useState([]);

  const fetchOpps = async () => {
    try {
      const res = await api.get('/opportunities');
      setOpportunities(res.data);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpps();
  }, []);

  const moveStage = async (id, newStage) => {
    // Optimistic UI update
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, stage: newStage } : o))
    );
    try {
      await api.patch(`/opportunities/${id}`, { stage: newStage });
    } catch (err) {
      fetchOpps();
    }
  };

  const openWonModal = async (oppId) => {
    try {
      const res = await api.get('/quotations', { params: { opportunity_id: oppId } });
      const approved = res.data.filter((q) => q.status === 'Approved');
      setQuotes(approved);
      setWonModal({ open: true, id: oppId, quoteId: approved[0]?.id || '' });
    } catch (err) {
      alert('Failed to fetch quotations');
    }
  };

  const handleMarkWon = async (e) => {
    e.preventDefault();
    if (!wonModal.quoteId) {
      alert('An approved quotation is required to mark an opportunity as Won.');
      return;
    }
    try {
      await api.post(`/opportunities/${wonModal.id}/mark-won`, { quotation_id: wonModal.quoteId });
      setWonModal({ open: false, id: null, quoteId: '' });
      fetchOpps();
    } catch (err) {
      alert(err.response?.data?.detail?.detail || 'Failed to mark as Won');
    }
  };

  const handleMarkLost = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/opportunities/${lostModal.id}/mark-lost`, { lost_reason: lostModal.reason });
      setLostModal({ open: false, id: null, reason: '' });
      fetchOpps();
    } catch (err) {
      alert('Failed to mark as Lost');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#1A2E4A]">Deals & Opportunities</h2>
          <p className="text-xs text-[#6B7C93] mt-0.5">Manage pipeline stages, quotations, and commercial closing</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#EEF2F7] p-0.5 rounded-[6px] border border-[#D1D9E6]">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-[4px] text-xs flex items-center ${viewMode === 'kanban' ? 'bg-white shadow text-[#1A2E4A]' : 'text-[#6B7C93]'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-[4px] text-xs flex items-center ${viewMode === 'list' ? 'bg-white shadow text-[#1A2E4A]' : 'text-[#6B7C93]'}`}
            >
              <List className="w-3.5 h-3.5 mr-1" /> List
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageOpps = opportunities.filter((o) => o.stage === stage && o.status === 'Open');
            const totalStageVal = stageOpps.reduce((acc, curr) => acc + Number(curr.amount), 0);

            return (
              <div key={stage} className="bg-[#F5F7FA] rounded-[8px] border border-[#D1D9E6] p-3 flex flex-col min-w-[220px]">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#D1D9E6]">
                  <span className="text-xs font-bold text-[#1A2E4A]">{stage}</span>
                  <span className="text-[10px] font-semibold bg-[#EEF2F7] px-2 py-0.5 rounded text-[#4B5563]">
                    {stageOpps.length}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[#6B7C93] mb-3">
                  {formatCurrency(totalStageVal)}
                </div>

                <div className="space-y-3 flex-1">
                  {stageOpps.map((opp) => (
                    <div key={opp.id} className="p-3 bg-white rounded-[6px] border border-[#D1D9E6] shadow-sm space-y-2">
                      <div className="font-semibold text-xs text-[#1A2E4A] line-clamp-1">{opp.title}</div>
                      <div className="text-[11px] text-[#6B7C93]">{opp.customer?.company || 'Company'}</div>
                      <div className="text-xs font-bold text-[#10B981] font-mono">{formatCurrency(opp.amount)}</div>

                      <div className="flex justify-between items-center pt-2 border-t border-[#EEF2F7] text-[10px]">
                        <span className="text-[#6B7C93]">{opp.owner?.name || 'Owner'}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openWonModal(opp.id)}
                            className="p-1 hover:bg-[#ECFDF5] text-[#059669] rounded"
                            title="Mark Won"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setLostModal({ open: true, id: opp.id, reason: '' })}
                            className="p-1 hover:bg-[#FEF2F2] text-[#EF4444] rounded"
                            title="Mark Lost"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Quick stage transition button */}
                      <div className="pt-1">
                        <select
                          value={opp.stage}
                          onChange={(e) => moveStage(opp.id, e.target.value)}
                          className="w-full text-[10px] p-1 border rounded bg-[#F8FAFC] text-[#475569]"
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>Move to {s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F7FA] border-b text-xs font-semibold text-[#1A2E4A]">
              <tr>
                <th className="py-3 px-4">Deal Title</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4">Close Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F7]">
              {opportunities.map((opp) => (
                <tr key={opp.id} className="hover:bg-[#F5F7FA]">
                  <td className="py-3 px-4 font-semibold text-[#1A2E4A]">{opp.title}</td>
                  <td className="py-3 px-4 text-xs text-[#6B7C93]">{opp.customer?.company}</td>
                  <td className="py-3 px-4"><Badge status="New" label={opp.stage} /></td>
                  <td className="py-3 px-4 font-mono text-xs">{formatCurrency(opp.amount)}</td>
                  <td className="py-3 px-4 text-xs text-[#6B7C93]">{formatDate(opp.close_date)}</td>
                  <td className="py-3 px-4"><Badge status={opp.status} /></td>
                  <td className="py-3 px-4 text-right">
                    {opp.status === 'Open' && (
                      <button onClick={() => openWonModal(opp.id)} className="text-xs text-[#059669] font-bold hover:underline">
                        Convert Won
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Mark Won Modal */}
      <Modal isOpen={wonModal.open} onClose={() => setWonModal({ open: false, id: null, quoteId: '' })} title="Convert Opportunity to Won">
        <form onSubmit={handleMarkWon} className="space-y-4">
          <p className="text-xs text-[#4B5563]">
            Select an approved quotation to verify commercial terms before marking this deal as Closed Won.
          </p>
          {quotes.length === 0 ? (
            <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#B45309] rounded">
              ⚠️ No approved quotations found for this opportunity. Please create and have a quotation approved first.
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-[#1F2937] block mb-1.5">Approved Quotation *</label>
              <select
                value={wonModal.quoteId}
                onChange={(e) => setWonModal({ ...wonModal, quoteId: e.target.value })}
                className="w-full p-2 border rounded text-xs bg-white"
                required
              >
                {quotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.number} — Total: {formatCurrency(q.grand_total)} (Approved by {q.approver?.name || 'Manager'})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setWonModal({ open: false, id: null, quoteId: '' })}>
              Cancel
            </Button>
            <Button type="submit" disabled={quotes.length === 0}>
              Confirm Conversion to Won
            </Button>
          </div>
        </form>
      </Modal>

      {/* Mark Lost Modal */}
      <Modal isOpen={lostModal.open} onClose={() => setLostModal({ open: false, id: null, reason: '' })} title="Document Closed Lost Reason">
        <form onSubmit={handleMarkLost} className="space-y-4">
          <Input
            label="Reason for Lost Deal *"
            required
            value={lostModal.reason}
            onChange={(e) => setLostModal({ ...lostModal, reason: e.target.value })}
            placeholder="e.g. Budget constrained, competitor chosen, timeline deferred"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setLostModal({ open: false, id: null, reason: '' })}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Confirm Closed Lost
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
