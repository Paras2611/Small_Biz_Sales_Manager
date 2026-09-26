import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, XCircle, Printer, Send, Search } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatDate, computeQuotationTotalsClient } from '../utils/formatters';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';

export function Quotation() {
  const [quotations, setQuotations] = useState([]);
  const [products, setProducts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [approvalModal, setApprovalModal] = useState({ open: false, type: 'approve', comment: '' });
  const user = useAuthStore((state) => state.user);

  // New Quote Form
  const [newQuote, setNewQuote] = useState({
    opportunity_id: '',
    discount_pct: 0,
    lines: [],
  });

  const fetchData = async () => {
    try {
      const [qRes, pRes, oRes] = await Promise.all([
        api.get('/quotations'),
        api.get('/products'),
        api.get('/opportunities'),
      ]);
      setQuotations(qRes.data);
      setProducts(pRes.data);
      setOpportunities(oRes.data);
      if (qRes.data.length > 0 && !selectedQuote) {
        setSelectedQuote(qRes.data[0]);
      }
    } catch (err) {
      console.error('Error fetching quotation data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addLineItem = (prod) => {
    setNewQuote((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        { product_id: prod.id, name: prod.name, qty: 1, unit_price: prod.unit_price, tax_rate: prod.tax_rate },
      ],
    }));
  };

  const removeLineItem = (index) => {
    setNewQuote((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const handleCreateQuote = async (e) => {
    e.preventDefault();
    if (newQuote.lines.length === 0) {
      alert('Add at least one product line item');
      return;
    }
    try {
      const payload = {
        opportunity_id: newQuote.opportunity_id || opportunities[0]?.id,
        discount_pct: Number(newQuote.discount_pct) || 0,
        lines: newQuote.lines.map((l) => ({
          product_id: l.product_id,
          qty: Number(l.qty),
          unit_price: Number(l.unit_price),
        })),
      };
      const res = await api.post('/quotations', payload);
      setIsCreateOpen(false);
      setNewQuote({ opportunity_id: '', discount_pct: 0, lines: [] });
      fetchData();
      setSelectedQuote(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create quotation');
    }
  };

  const handleSubmitApproval = async (id) => {
    try {
      const res = await api.post(`/quotations/${id}/submit`);
      setSelectedQuote(res.data);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Submission failed');
    }
  };

  const handleApprovalDecision = async (e) => {
    e.preventDefault();
    const endpoint = approvalModal.type === 'approve' ? 'approve' : 'reject';
    try {
      const res = await api.post(`/quotations/${selectedQuote.id}/${endpoint}`, {
        comment: approvalModal.comment,
      });
      setSelectedQuote(res.data);
      setApprovalModal({ open: false, type: 'approve', comment: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Approval action failed');
    }
  };

  const isManager = user?.role === 'sales_manager' || user?.role === 'administrator';
  const computedLive = computeQuotationTotalsClient(newQuote.lines, newQuote.discount_pct);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#1A2E4A]">Quotations & Commercial Proposals</h2>
          <p className="text-xs text-[#6B7C93] mt-0.5">Automated line-item pricing, tax rules, and manager sign-off</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Build Quotation
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quotation List (4 cols) */}
        <Card className="lg:col-span-4 p-0 overflow-hidden">
          <div className="p-3 bg-[#F5F7FA] border-b text-xs font-bold text-[#1A2E4A]">All Quotations</div>
          <div className="divide-y divide-[#EEF2F7] max-h-[600px] overflow-y-auto">
            {quotations.map((q) => (
              <div
                key={q.id}
                onClick={() => setSelectedQuote(q)}
                className={`p-3.5 cursor-pointer transition-colors ${
                  selectedQuote?.id === q.id ? 'bg-[#EFF6FF] border-l-4 border-l-[#2B5FAD]' : 'hover:bg-[#F5F7FA]'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-xs text-[#1A2E4A]">{q.number}</span>
                  <Badge status={q.status} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6B7C93]">{formatDate(q.created_at)}</span>
                  <span className="font-bold text-[#10B981]">{formatCurrency(q.grand_total)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Selected Quotation Document View (8 cols) */}
        <div className="lg:col-span-8">
          {selectedQuote ? (
            <Card className="p-6 space-y-6 bg-white border border-[#D1D9E6]">
              {/* Document Header */}
              <div className="flex justify-between items-start pb-4 border-b border-[#D1D9E6]">
                <div>
                  <span className="text-[10px] font-mono text-[#6B7C93] tracking-widest uppercase">Official Commercial Quotation</span>
                  <h3 className="text-2xl font-bold font-mono text-[#1A2E4A] mt-1">{selectedQuote.number}</h3>
                  <p className="text-xs text-[#6B7C93] mt-1">Generated: {formatDate(selectedQuote.created_at)}</p>
                </div>
                <div className="text-right space-y-2">
                  <Badge status={selectedQuote.status} className="text-sm px-3 py-1" />
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="p-1.5 border rounded text-[#6B7C93] hover:text-[#1A2E4A] text-xs flex items-center"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1" /> Print / PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Status & Approver Info */}
              {selectedQuote.approved_at && (
                <div className={`p-3 rounded-[6px] text-xs ${selectedQuote.status === 'Approved' ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]' : 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]'}`}>
                  <div className="font-bold">
                    {selectedQuote.status === 'Approved' ? '✓ Managerial Approval Granted' : '✕ Quotation Rejected'}
                  </div>
                  <div>Reviewed by: {selectedQuote.approver?.name || 'Sales Manager'} on {formatDate(selectedQuote.approved_at)}</div>
                  {selectedQuote.approval_comment && (
                    <div className="mt-1 italic">"{selectedQuote.approval_comment}"</div>
                  )}
                </div>
              )}

              {/* Line Items Table */}
              <div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F7FA] border-b text-[#1A2E4A] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Product Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Tax Rate</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F7]">
                    {selectedQuote.lines.map((line) => (
                      <tr key={line.id}>
                        <td className="py-2.5 px-3 font-medium text-[#1F2937]">
                          {line.product?.name || line.description}
                          <span className="block text-[10px] text-[#6B7C93] font-mono">{line.product?.sku}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">{line.qty}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(line.unit_price)}</td>
                        <td className="py-2.5 px-3 text-right">{line.tax_rate}%</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1F2937]">{formatCurrency(line.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mathematical Summary Calculation */}
              <div className="flex justify-end pt-4 border-t border-[#EEF2F7]">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#6B7C93]">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(selectedQuote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7C93]">
                    <span>Discount ({selectedQuote.discount_pct}%):</span>
                    <span className="font-mono text-[#DC2626]">- {formatCurrency(selectedQuote.discount_amount)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7C93]">
                    <span>Taxable Amount:</span>
                    <span className="font-mono">{formatCurrency(Number(selectedQuote.subtotal) - Number(selectedQuote.discount_amount))}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7C93]">
                    <span>GST Tax Amount:</span>
                    <span className="font-mono">{formatCurrency(selectedQuote.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#1A2E4A] pt-2 border-t border-[#D1D9E6]">
                    <span>Grand Total:</span>
                    <span className="font-mono text-[#10B981]">{formatCurrency(selectedQuote.grand_total)}</span>
                  </div>
                </div>
              </div>

              {/* Workflow Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#D1D9E6]">
                {selectedQuote.status === 'Draft' && (
                  <Button onClick={() => handleSubmitApproval(selectedQuote.id)}>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Submit for Manager Approval
                  </Button>
                )}

                {selectedQuote.status === 'Pending Approval' && isManager && (
                  <>
                    <Button
                      variant="danger"
                      onClick={() => setApprovalModal({ open: true, type: 'reject', comment: '' })}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject Proposal
                    </Button>
                    <Button
                      onClick={() => setApprovalModal({ open: true, type: 'approve', comment: '' })}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve Proposal
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ) : (
            <p className="text-xs text-[#6B7C93]">Select a quotation to view details.</p>
          )}
        </div>
      </div>

      {/* Build Quotation Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Build Commercial Quotation" maxWidth="max-w-2xl">
        <form onSubmit={handleCreateQuote} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#1F2937] block mb-1">Target Opportunity *</label>
            <select
              value={newQuote.opportunity_id}
              onChange={(e) => setNewQuote({ ...newQuote, opportunity_id: e.target.value })}
              className="w-full p-2 border rounded text-xs bg-white"
              required
            >
              {opportunities.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title} — {o.customer?.company} ({formatCurrency(o.amount)})
                </option>
              ))}
            </select>
          </div>

          {/* Product Picker */}
          <div>
            <label className="text-xs font-medium text-[#1F2937] block mb-1">Add Products from Catalog</label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border rounded bg-[#F8FAFC]">
              {products.filter((p) => p.active).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addLineItem(p)}
                  className="p-2 text-left bg-white border rounded text-xs hover:border-[#2B5FAD] flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold text-[#1A2E4A]">{p.name}</div>
                    <div className="text-[10px] text-[#6B7C93]">{formatCurrency(p.unit_price)}</div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-[#2B5FAD]" />
                </button>
              ))}
            </div>
          </div>

          {/* Selected Lines */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#1F2937] block">Quotation Line Items</label>
            {newQuote.lines.map((line, idx) => (
              <div key={idx} className="flex gap-2 items-center text-xs bg-white p-2 border rounded">
                <span className="flex-1 font-semibold text-[#1A2E4A]">{line.name}</span>
                <input
                  type="number"
                  min="1"
                  value={line.qty}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const updated = [...newQuote.lines];
                    updated[idx].qty = val;
                    setNewQuote({ ...newQuote, lines: updated });
                  }}
                  className="w-16 p-1 border rounded text-center"
                />
                <span className="font-mono text-xs w-24 text-right">{formatCurrency(line.unit_price * line.qty)}</span>
                <button type="button" onClick={() => removeLineItem(idx)} className="text-[#EF4444] p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <Input
            label="Commercial Discount % (0–100)"
            type="number"
            min={0}
            max={100}
            value={newQuote.discount_pct}
            onChange={(e) => setNewQuote({ ...newQuote, discount_pct: e.target.value })}
          />

          {/* Live computed summary */}
          <div className="p-3 bg-[#F5F7FA] rounded text-xs space-y-1">
            <div className="flex justify-between"><span>Subtotal:</span> <span>{formatCurrency(computedLive.subtotal)}</span></div>
            <div className="flex justify-between"><span>Tax (18% GST):</span> <span>{formatCurrency(computedLive.tax_amount)}</span></div>
            <div className="flex justify-between font-bold text-sm text-[#10B981]"><span>Grand Total:</span> <span>{formatCurrency(computedLive.grand_total)}</span></div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit">Create Draft Quotation</Button>
          </div>
        </form>
      </Modal>

      {/* Approve/Reject Modal */}
      <Modal
        isOpen={approvalModal.open}
        onClose={() => setApprovalModal({ open: false, type: 'approve', comment: '' })}
        title={approvalModal.type === 'approve' ? 'Approve Commercial Quotation' : 'Reject Quotation'}
      >
        <form onSubmit={handleApprovalDecision} className="space-y-4">
          <Input
            label="Manager Comments / Rationale"
            value={approvalModal.comment}
            onChange={(e) => setApprovalModal({ ...approvalModal, comment: e.target.value })}
            placeholder="e.g. Terms reviewed and commercial discount approved."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setApprovalModal({ open: false, type: 'approve', comment: '' })}>
              Cancel
            </Button>
            <Button type="submit" variant={approvalModal.type === 'approve' ? 'primary' : 'danger'}>
              Confirm Decision
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
