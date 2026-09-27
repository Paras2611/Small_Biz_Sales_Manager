import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Target,
  FileSpreadsheet,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  X,
  Calendar,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useConfirm } from '../context/ConfirmContext';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import api from '../api/client';

export function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAiInsight, setShowAiInsight] = useState(true);
  const [dateFilter, setDateFilter] = useState('This Month');
  const confirm = useConfirm();

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/dashboard/metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefreshData = () => {
    confirm({
      title: 'Confirm Refresh Dashboard',
      message: 'Re-sync and fetch latest live revenue pipeline and AI metrics from backend server?',
      confirmText: 'Sync & Refresh',
      cancelText: 'Cancel',
      variant: 'primary',
      operation: 'UPDATE',
      onConfirm: async () => {
        await fetchDashboardData();
      },
    });
  };

  const revenueData = [
    { month: 'Jan', Actual: 10000, Forecast: 15000 },
    { month: 'Feb', Actual: 16000, Forecast: 22000 },
    { month: 'Mar', Actual: 24000, Forecast: 30000 },
    { month: 'Apr', Actual: 32000, Forecast: 38000 },
    { month: 'May', Actual: 0, Forecast: 42000 },
    { month: 'Jun', Actual: 0, Forecast: 48000 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar matching Image 3 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1A2E4A]">Sales Dashboard</h2>
          <p className="text-xs text-[#6B7C93] mt-0.5">A quick overview of your sales pipeline and upcoming activities.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs bg-white border border-[#D1D9E6] px-3 py-2 rounded-[6px] text-[#1F2937] font-semibold"
          >
            <option value="This Month">This Month</option>
            <option value="This Quarter">This Quarter</option>
            <option value="This Year">This Year</option>
          </select>
          <button
            onClick={handleRefreshData}
            className="text-xs bg-white border border-[#D1D9E6] px-3 py-2 rounded-[6px] text-[#1F2937] hover:bg-[#F5F7FA] font-semibold"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* 4 Top Metric KPI Cards (Matching Image 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Leads */}
        <Card className="p-4 bg-white border border-[#D1D9E6] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#6B7C93] font-medium">Leads</div>
            <div className="text-2xl font-bold text-[#1A2E4A]">48</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center mt-0.5">
              <TrendingUp className="w-3 h-3 mr-1" /> 12% vs last month
            </div>
          </div>
        </Card>

        {/* Opportunities */}
        <Card className="p-4 bg-white border border-[#D1D9E6] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#6B7C93] font-medium">Opportunities</div>
            <div className="text-2xl font-bold text-[#1A2E4A]">18</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center mt-0.5">
              <TrendingUp className="w-3 h-3 mr-1" /> 20% vs last month
            </div>
          </div>
        </Card>

        {/* Quotations Pending */}
        <Card className="p-4 bg-white border border-[#D1D9E6] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#6B7C93] font-medium">Quotations Pending</div>
            <div className="text-2xl font-bold text-[#1A2E4A]">7</div>
            <div className="text-[11px] text-rose-600 font-semibold flex items-center mt-0.5">
              ↓ 13% vs last month
            </div>
          </div>
        </Card>

        {/* Forecast Revenue */}
        <Card className="p-4 bg-white border border-[#D1D9E6] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#6B7C93] font-medium">Forecast Revenue</div>
            <div className="text-2xl font-bold text-[#1A2E4A]">$86,500</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center mt-0.5">
              <TrendingUp className="w-3 h-3 mr-1" /> 28% vs last month
            </div>
          </div>
        </Card>
      </div>

      {/* Middle Row: Sales Pipeline Chevron Flow (8 cols) & Upcoming Tasks (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Pipeline Chevron Cards */}
        <Card className="lg:col-span-8 p-5 bg-white border border-[#D1D9E6] space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#EEF2F7]">
            <div>
              <h3 className="text-base font-bold text-[#1A2E4A]">Sales Pipeline</h3>
              <p className="text-xs text-[#6B7C93]">Track your opportunities through the sales process.</p>
            </div>
            <Link to="/opportunities" className="text-xs text-[#2B5FAD] font-semibold hover:underline flex items-center">
              View all opportunities <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            {/* 1. Qualification */}
            <div className="p-4 rounded-[10px] bg-blue-50/80 border border-blue-200 relative overflow-hidden">
              <div className="text-xs font-bold text-blue-900">1. Qualification</div>
              <div className="text-2xl font-extrabold text-blue-900 mt-2">10</div>
              <div className="text-xs font-semibold text-blue-700 mt-0.5 font-mono">$24,000</div>
            </div>

            {/* 2. Proposal */}
            <div className="p-4 rounded-[10px] bg-emerald-50/80 border border-emerald-200 relative overflow-hidden">
              <div className="text-xs font-bold text-emerald-900">2. Proposal</div>
              <div className="text-2xl font-extrabold text-emerald-900 mt-2">6</div>
              <div className="text-xs font-semibold text-emerald-700 mt-0.5 font-mono">$18,500</div>
            </div>

            {/* 3. Negotiation */}
            <div className="p-4 rounded-[10px] bg-orange-50/80 border border-orange-200 relative overflow-hidden">
              <div className="text-xs font-bold text-amber-900">3. Negotiation</div>
              <div className="text-2xl font-extrabold text-amber-900 mt-2">4</div>
              <div className="text-xs font-semibold text-amber-700 mt-0.5 font-mono">$21,000</div>
            </div>

            {/* 4. Closed */}
            <div className="p-4 rounded-[10px] bg-slate-100 border border-slate-200 relative overflow-hidden">
              <div className="text-xs font-bold text-slate-800">4. Closed</div>
              <div className="text-2xl font-extrabold text-slate-800 mt-2">3</div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5 font-mono">$12,000</div>
            </div>
          </div>
        </Card>

        {/* Upcoming Tasks Widget */}
        <Card className="lg:col-span-4 p-5 bg-white border border-[#D1D9E6] space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#EEF2F7]">
            <h3 className="text-sm font-bold text-[#1A2E4A]">Upcoming Tasks</h3>
            <Link to="/activities" className="text-xs text-[#2B5FAD] font-semibold hover:underline flex items-center">
              View all <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { date: 'APR 22', title: 'Follow up with Acme Corp', type: 'Call · Lead', time: '10:00 AM', dot: 'bg-blue-500' },
              { date: 'APR 22', title: 'Send quotation to BrightTech', type: 'Email · Quotation', time: '2:00 PM', dot: 'bg-orange-500' },
              { date: 'APR 23', title: 'Demo with Global Retail', type: 'Online Meeting · Opportunity', time: '11:00 AM', dot: 'bg-blue-500' },
              { date: 'APR 24', title: 'Follow up with Metro Solutions', type: 'Call · Opportunity', time: '3:00 PM', dot: 'bg-gray-400' },
            ].map((t, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-[6px] hover:bg-[#F8FAFC]">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-center min-w-[44px]">
                    <div className="text-[9px] font-bold uppercase">{t.date.split(' ')[0]}</div>
                    <div className="text-xs font-extrabold">{t.date.split(' ')[1]}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1A2E4A]">{t.title}</div>
                    <div className="text-[10px] text-[#6B7C93]">{t.type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-semibold text-[#1F2937]">{t.time}</span>
                  <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row: Revenue Forecast Bar Chart (8 cols) & AI Insight (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Forecast Bar Chart */}
        <Card className="lg:col-span-8 p-5 bg-white border border-[#D1D9E6] space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#EEF2F7]">
            <div>
              <h3 className="text-base font-bold text-[#1A2E4A]">Revenue Forecast</h3>
              <p className="text-xs text-[#6B7C93]">Expected revenue from open opportunities.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" /> Actual</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#93C5FD]" /> Forecast</span>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tickFormatter={(val) => `$${val / 1000}K`} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Bar dataKey="Actual" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Forecast" fill="#93C5FD" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI Insight Box Widget */}
        <div className="lg:col-span-4">
          {showAiInsight ? (
            <Card className="p-5 bg-emerald-50/60 border border-emerald-200 relative space-y-3 h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-600" /> AI Insight
                  </div>
                  <button onClick={() => setShowAiInsight(false)} className="text-emerald-700 hover:text-emerald-900 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-emerald-950">You're on track to meet your target.</div>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      Based on your current pipeline, you have a 78% chance of reaching your monthly revenue goal of $90,000.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to="/opportunities"
                  className="inline-flex items-center justify-center px-4 py-2 bg-white border border-emerald-300 rounded-[6px] text-xs font-bold text-emerald-900 hover:bg-emerald-100/50 shadow-sm transition-colors"
                >
                  View opportunities <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="p-5 bg-white border border-[#D1D9E6] flex items-center justify-center h-full">
              <button onClick={() => setShowAiInsight(true)} className="text-xs font-bold text-[#2B5FAD] flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5" /> Re-enable AI Insight
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
