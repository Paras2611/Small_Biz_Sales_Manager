import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Target,
  Briefcase,
  FileSpreadsheet,
  Award,
  Percent,
  AlertCircle,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import api from '../api/client';

export function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [mRes, fRes, oRes] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/dashboard/funnel'),
        api.get('/dashboard/overdue-followups'),
      ]);
      setMetrics(mRes.data);
      setFunnel(fRes.data);
      setOverdue(oRes.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse bg-white/70" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Leads', val: metrics.kpis.total_leads, icon: Users, color: '#3A7BD5' },
    { label: 'Qualified Leads', val: metrics.kpis.qualified_leads, icon: Target, color: '#10B981' },
    { label: 'Open Opportunities', val: metrics.kpis.open_opportunities, icon: Briefcase, color: '#2B5FAD' },
    { label: 'Quotation Value', val: formatCurrency(metrics.kpis.quotation_value), icon: FileSpreadsheet, color: '#D97706' },
    { label: 'Won Value', val: formatCurrency(metrics.kpis.won_value), icon: Award, color: '#059669' },
    { label: 'Conversion Rate', val: `${metrics.kpis.conversion_rate}%`, icon: Percent, color: '#8B5CF6' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1A2E4A]">Sales Performance Dashboard</h2>
          <p className="text-xs text-[#6B7C93] mt-0.5">Real-time pipeline metrics and actionable follow-ups</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="text-xs bg-white border border-[#D1D9E6] px-3 py-1.5 rounded-[6px] text-[#1F2937] hover:bg-[#EEF2F7] font-medium"
        >
          Refresh Data
        </button>
      </div>

      {/* Row 1: 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className="p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#6B7C93]">{kpi.label}</span>
                <Icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-[#1A2E4A] tracking-tight">{kpi.val}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Row 2: Funnel Chart & Top 5 Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <CardHeader title="Lead-to-Conversion Sales Funnel" subtitle="Volume by lifecycle stage" />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 12, fill: '#1F2937' }} />
                <Tooltip
                  formatter={(val, name, props) => [`${val} records (${formatCurrency(props.payload.value)})`, 'Volume']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '6px', borderColor: '#D1D9E6', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#2B5FAD" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader
            title="Top Open Opportunities"
            subtitle="Sorted by commercial value"
            action={<Link to="/opportunities" className="text-xs text-[#2B5FAD] font-medium hover:underline flex items-center">View all <ArrowUpRight className="w-3 h-3 ml-0.5" /></Link>}
          />
          <div className="space-y-3">
            {metrics.top_opportunities.length === 0 ? (
              <p className="text-xs text-[#6B7C93] py-4 text-center">No open opportunities found.</p>
            ) : (
              metrics.top_opportunities.map((opp) => (
                <div key={opp.id} className="p-3 rounded-[6px] border border-[#D1D9E6] hover:bg-[#F5F7FA] transition-colors flex justify-between items-center">
                  <div>
                    <Link to={`/opportunities`} className="text-sm font-semibold text-[#1A2E4A] hover:text-[#2B5FAD]">
                      {opp.title}
                    </Link>
                    <p className="text-xs text-[#6B7C93]">{opp.company} · {opp.stage}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#10B981]">{formatCurrency(opp.amount)}</span>
                    <p className="text-[10px] text-[#6B7C93]">Due {opp.close_date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Row 3: Overdue and Due Today Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overdue Panel */}
        <Card className="border-t-4 border-t-[#DC2626]">
          <CardHeader
            title="Overdue Follow-ups"
            subtitle="Immediate action required to avoid lead drop-off"
            action={<Badge status="Overdue" label={`${metrics.overdue_count} Overdue`} />}
          />
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {overdue.length === 0 ? (
              <p className="text-xs text-[#10B981] py-4 text-center font-medium">✓ Zero overdue follow-up tasks!</p>
            ) : (
              overdue.map((item) => (
                <Link
                  key={item.id}
                  to="/followups"
                  className="block p-3 rounded-[6px] bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FEE2E2] transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                        <span className="text-xs font-semibold text-[#B91C1C]">{item.type} with {item.linked_name}</span>
                      </div>
                      <p className="text-[11px] text-[#7F1D1D] mt-1">Assigned to: {item.owner_name}</p>
                    </div>
                    <span className="text-[11px] font-mono text-[#DC2626] font-medium">{formatDateTime(item.due_at)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Due Today Panel */}
        <Card className="border-t-4 border-t-[#D97706]">
          <CardHeader
            title="Due Today Follow-ups"
            subtitle="Scheduled interactions for today"
            action={<Badge status="Medium" label={`${metrics.due_today_count} Today`} />}
          />
          <div className="p-4 bg-[#FFFBEB] rounded-[6px] border border-[#FDE68A] text-xs text-[#92400E]">
            <p className="font-semibold flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#D97706]" />
              {metrics.due_today_count} planned interaction(s) scheduled for today.
            </p>
            <p className="mt-1 text-[#B45309]">Review follow-ups to maintain prompt prospect communication.</p>
            <div className="mt-3">
              <Link to="/followups" className="text-xs font-bold text-[#D97706] hover:underline">
                Open Follow-ups Workspace →
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
