import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Calendar, AlertCircle, Phone, Mail, Presentation, MessageSquare } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { formatDateTime } from '../utils/formatters';
import api from '../api/client';

export function Followups() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completeModal, setCompleteModal] = useState({ open: false, id: null, outcome: '' });

  const fetchFollowups = async () => {
    try {
      const res = await api.get('/followups');
      setFollowups(res.data);
    } catch (err) {
      console.error('Failed to load followups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, []);

  const handleComplete = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/followups/${completeModal.id}/complete`, { outcome: completeModal.outcome });
      setCompleteModal({ open: false, id: null, outcome: '' });
      fetchFollowups();
    } catch (err) {
      alert('Failed to complete follow-up');
    }
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const overdueList = followups.filter((f) => f.status === 'Scheduled' && new Date(f.due_at) < now);
  const dueTodayList = followups.filter((f) => {
    const d = new Date(f.due_at);
    return f.status === 'Scheduled' && d >= todayStart && d <= todayEnd;
  });
  const upcomingList = followups.filter((f) => {
    const d = new Date(f.due_at);
    return f.status === 'Scheduled' && d > now && !(d >= todayStart && d <= todayEnd);
  });
  const completedList = followups.filter((f) => f.status === 'Completed');

  const renderCard = (f) => (
    <div key={f.id} className="p-3.5 bg-white rounded-[6px] border border-[#D1D9E6] shadow-sm space-y-2">
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold text-[#1A2E4A]">{f.type}</span>
        <span className="text-[11px] font-mono text-[#6B7C93]">{formatDateTime(f.due_at)}</span>
      </div>
      <p className="text-xs text-[#4B5563]">{f.notes || 'No notes specified.'}</p>
      {f.outcome && (
        <div className="text-[11px] text-[#059669] bg-[#ECFDF5] p-1.5 rounded">
          ✓ Outcome: {f.outcome}
        </div>
      )}
      <div className="flex justify-between items-center pt-2 border-t border-[#EEF2F7]">
        <span className="text-[10px] text-[#6B7C93]">Assigned: {f.owner?.name || 'User'}</span>
        {f.status === 'Scheduled' && (
          <button
            onClick={() => setCompleteModal({ open: true, id: f.id, outcome: '' })}
            className="text-xs text-[#10B981] font-semibold hover:underline flex items-center"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1A2E4A]">Follow-up Activity Management</h2>
        <p className="text-xs text-[#6B7C93] mt-0.5">Track calls, meetings, demos, and pricing discussions</p>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Overdue */}
        <div className="space-y-3">
          <div className="p-3 bg-[#FEF2F2] border-t-4 border-t-[#DC2626] rounded-t-[6px] border border-[#FECACA] flex justify-between items-center">
            <span className="text-sm font-bold text-[#B91C1C]">Overdue</span>
            <Badge status="Overdue" label={`${overdueList.length}`} />
          </div>
          <div className="space-y-3 min-h-[300px] bg-[#F5F7FA] p-2 rounded-b-[6px] border border-t-0 border-[#D1D9E6]">
            {overdueList.length === 0 ? (
              <p className="text-xs text-[#6B7C93] text-center py-8">No overdue follow-ups.</p>
            ) : (
              overdueList.map(renderCard)
            )}
          </div>
        </div>

        {/* Column 2: Due Today */}
        <div className="space-y-3">
          <div className="p-3 bg-[#FFFBEB] border-t-4 border-t-[#D97706] rounded-t-[6px] border border-[#FDE68A] flex justify-between items-center">
            <span className="text-sm font-bold text-[#B45309]">Due Today</span>
            <Badge status="Medium" label={`${dueTodayList.length}`} />
          </div>
          <div className="space-y-3 min-h-[300px] bg-[#F5F7FA] p-2 rounded-b-[6px] border border-t-0 border-[#D1D9E6]">
            {dueTodayList.length === 0 ? (
              <p className="text-xs text-[#6B7C93] text-center py-8">No follow-ups scheduled today.</p>
            ) : (
              dueTodayList.map(renderCard)
            )}
          </div>
        </div>

        {/* Column 3: Upcoming */}
        <div className="space-y-3">
          <div className="p-3 bg-[#EFF6FF] border-t-4 border-t-[#2B5FAD] rounded-t-[6px] border border-[#BFDBFE] flex justify-between items-center">
            <span className="text-sm font-bold text-[#1E40AF]">Upcoming</span>
            <Badge status="New" label={`${upcomingList.length}`} />
          </div>
          <div className="space-y-3 min-h-[300px] bg-[#F5F7FA] p-2 rounded-b-[6px] border border-t-0 border-[#D1D9E6]">
            {upcomingList.length === 0 ? (
              <p className="text-xs text-[#6B7C93] text-center py-8">No upcoming follow-ups.</p>
            ) : (
              upcomingList.map(renderCard)
            )}
          </div>
        </div>
      </div>

      {/* Complete Modal */}
      <Modal
        isOpen={completeModal.open}
        onClose={() => setCompleteModal({ open: false, id: null, outcome: '' })}
        title="Record Follow-up Outcome"
      >
        <form onSubmit={handleComplete} className="space-y-4">
          <Input
            label="Interaction Outcome / Next Step *"
            required
            value={completeModal.outcome}
            onChange={(e) => setCompleteModal({ ...completeModal, outcome: e.target.value })}
            placeholder="e.g. Client requested revised quotation with 10% discount."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCompleteModal({ open: false, id: null, outcome: '' })}>
              Cancel
            </Button>
            <Button type="submit">Save Outcome</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
