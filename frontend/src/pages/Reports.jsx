import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useConfirm } from '../context/ConfirmContext';
import { formatCurrency } from '../utils/formatters';
import { exportSalesReportCSV } from '../utils/exportUtils';
import api from '../api/client';

export function Reports() {
  const [pipeline, setPipeline] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [pRes, fRes, qRes, oRes] = await Promise.all([
          api.get('/reports/pipeline'),
          api.get('/reports/conversion-funnel'),
          api.get('/reports/quotation-status'),
          api.get('/reports/owner-performance'),
        ]);
        setPipeline(pRes.data);
        setFunnel(fRes.data);
        setQuotes(qRes.data);
        setOwners(oRes.data);
      } catch (err) {
        console.error('Reports fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExportReport = () => {
    confirm({
      title: 'Confirm Download Sales Report',
      message: 'Download formatted CSV export file of sales performance and conversion funnel metrics onto your device?',
      confirmText: 'Download Report',
      cancelText: 'Cancel',
      variant: 'primary',
      operation: 'CREATE',
      onConfirm: () => {
        exportSalesReportCSV(pipeline, funnel, quotes, owners);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1A2E4A]">Sales Reports & Analytics</h2>
          <p className="text-xs text-[#6B7C93] mt-0.5">High-level visibility into conversion velocity and revenue metrics</p>
        </div>

        <Button onClick={handleExportReport} className="text-xs font-semibold">
          <Download className="w-3.5 h-3.5 mr-1.5" /> Download Sales Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel 1: Pipeline by Stage */}
        <Card>
          <CardHeader title="Pipeline by Stage" subtitle="Active opportunity values across stages" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Value']} />
                <Bar dataKey="value" fill="#2B5FAD" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Panel 2: Conversion Funnel */}
        <Card>
          <CardHeader title="Conversion Funnel Volume" subtitle="Prospect counts progressing across milestones" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Panel 3: Quotation Status Summary */}
        <Card>
          <CardHeader title="Quotation Status Summary" subtitle="Total commercial value by approval stage" />
          <div className="space-y-3 pt-2">
            {quotes.map((q) => (
              <div key={q.status} className="flex justify-between items-center p-3 rounded bg-[#F5F7FA]">
                <div className="flex items-center gap-2">
                  <Badge status={q.status} />
                  <span className="text-xs text-[#6B7C93]">({q.count} quotes)</span>
                </div>
                <span className="font-mono text-xs font-bold text-[#1F2937]">{formatCurrency(q.total_value)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Panel 4: Owner Performance */}
        <Card>
          <CardHeader title="Sales Rep Performance" subtitle="Deals won and converted revenue per executive" />
          <div className="space-y-3 pt-2">
            {owners.map((o) => (
              <div key={o.user_id} className="flex justify-between items-center p-3 rounded bg-[#F5F7FA]">
                <div>
                  <span className="text-xs font-bold text-[#1A2E4A] block">{o.name}</span>
                  <span className="text-[10px] text-[#6B7C93]">{o.leads_owned} leads owned · {o.deals_won} deals won</span>
                </div>
                <span className="font-mono text-xs font-bold text-[#059669]">{formatCurrency(o.won_revenue)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
