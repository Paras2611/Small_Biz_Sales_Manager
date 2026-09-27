import { formatCurrency, formatDate } from './formatters';

/**
 * Downloads a beautifully designed, print-ready HTML/PDF invoice document for a Quotation.
 */
export function exportQuotationDocument(quote) {
  if (!quote) return;

  const quoteNumber = quote.number || 'QT-2024-001';
  const createdDate = quote.created_at ? formatDate(quote.created_at) : formatDate(new Date().toISOString());
  const validUntil = quote.valid_until || '30 days from issue date';
  const customerName = quote.customer_name || quote.customer?.company || 'Acme Corp';
  const customerEmail = quote.customer_email || quote.customer?.email || 'acme@corp.com';
  const status = quote.status || 'Draft';

  const lines = quote.lines && quote.lines.length > 0 ? quote.lines : [
    { name: 'Website Design', desc: 'UI/UX design and layouts', qty: 1, unit_price: 5000, tax_rate: 10, line_total: 5500 },
    { name: 'Frontend Development', desc: 'Responsive web development', qty: 1, unit_price: 8000, tax_rate: 10, line_total: 7920 },
    { name: 'Backend Development', desc: 'API and database setup', qty: 1, unit_price: 6000, tax_rate: 10, line_total: 6600 },
    { name: 'Ongoing Support', desc: '3 months post-launch support', qty: 3, unit_price: 500, tax_rate: 10, line_total: 1650 },
  ];

  const subtotal = quote.subtotal || lines.reduce((acc, l) => acc + (l.qty * (l.unit_price || 0)), 0);
  const discountAmount = quote.discount_amount || (subtotal * 0.1);
  const taxAmount = quote.tax_amount || 1950;
  const grandTotal = quote.grand_total || (subtotal - discountAmount + taxAmount);
  const terms = quote.terms || 'Payment is due within 30 days of invoice date. Work will commence after approval.';
  const notes = quote.notes || 'Thank you for the opportunity! Please contact us if you have any questions.';

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Commercial Quotation ${quoteNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1E293B; margin: 0; padding: 40px; background-color: #FFFFFF; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-b: 2px solid #2B5FAD; padding-bottom: 20px; margin-bottom: 30px; }
    .logo-brand { font-size: 24px; font-weight: 800; color: #1A2E4A; }
    .logo-sub { font-size: 12px; color: #64748B; margin-top: 2px; }
    .quote-title { text-align: right; }
    .quote-num { font-family: monospace; font-size: 22px; font-weight: 800; color: #2B5FAD; }
    .status-stamp { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-top: 6px; background: ${status === 'Approved' ? '#ECFDF5; color: #047857; border: 1px solid #A7F3D0;' : '#EFF6FF; color: #1E40AF; border: 1px solid #BFDBFE;'}; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #F8FAFC; padding: 20px; border-radius: 8px; border: 1px solid #E2E8F0; }
    .label { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 4px; }
    .val { font-size: 14px; font-weight: 700; color: #0F172A; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #1A2E4A; color: #FFFFFF; text-align: left; padding: 10px 14px; font-size: 12px; font-weight: 700; }
    td { padding: 12px 14px; border-bottom: 1px solid #E2E8F0; font-size: 12px; }
    .num { font-family: monospace; text-align: right; }
    .summary-box { float: right; width: 300px; margin-bottom: 30px; }
    .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569; }
    .grand-total { display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: 800; color: #047857; border-top: 2px solid #047857; margin-top: 8px; }
    .footer-section { clear: both; margin-top: 40px; pt: 20px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #64748B; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .footer-card { background: #F8FAFC; padding: 14px; border-radius: 6px; border: 1px solid #E2E8F0; }
    .footer-card h4 { margin: 0 0 6px 0; font-size: 12px; color: #1E293B; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo-brand">Small Business Sales Manager</div>
      <div class="logo-sub">Commercial Quotation & Billing Invoice</div>
    </div>
    <div class="quote-title">
      <div class="quote-num">${quoteNumber}</div>
      <div class="status-stamp">${status}</div>
    </div>
  </div>

  <div class="details-grid">
    <div>
      <div class="label">Customer & Contact</div>
      <div class="val">${customerName}</div>
      <div style="font-size:12px; color:#475569; margin-top:2px;">${customerEmail}</div>
    </div>
    <div>
      <div class="label">Quotation Metadata</div>
      <div style="font-size:12px; color:#475569;"><strong>Date Issued:</strong> ${createdDate}</div>
      <div style="font-size:12px; color:#475569; margin-top:2px;"><strong>Valid Until:</strong> ${validUntil}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item & Description</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Unit Price</th>
        <th style="text-align:right;">Tax</th>
        <th style="text-align:right;">Line Total</th>
      </tr>
    </thead>
    <tbody>
      ${lines.map((l) => `
        <tr>
          <td>
            <strong>${l.name || l.product?.name || 'Service Item'}</strong>
            <div style="font-size:11px; color:#64748B;">${l.desc || l.description || ''}</div>
          </td>
          <td style="text-align:center;">${l.qty}</td>
          <td class="num">${formatCurrency(l.unit_price)}</td>
          <td class="num">${l.tax_rate || 10}% GST</td>
          <td class="num" style="font-weight:700;">${formatCurrency(l.line_total || (l.qty * l.unit_price))}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="summary-box">
    <div class="summary-row"><span>Subtotal:</span> <span class="num">${formatCurrency(subtotal)}</span></div>
    <div class="summary-row"><span>Discount:</span> <span class="num" style="color:#DC2626;">-${formatCurrency(discountAmount)}</span></div>
    <div class="summary-row"><span>Tax (GST):</span> <span class="num">${formatCurrency(taxAmount)}</span></div>
    <div class="grand-total"><span>Grand Total:</span> <span class="num">${formatCurrency(grandTotal)}</span></div>
  </div>

  <div class="footer-section">
    <div class="footer-card">
      <h4>Terms & Conditions</h4>
      <p style="margin:0;">${terms}</p>
    </div>
    <div class="footer-card">
      <h4>Customer Notes</h4>
      <p style="margin:0;">${notes}</p>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Quotation_${quoteNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a designed Sales Performance Report file (.csv format).
 */
export function exportSalesReportCSV(pipeline, funnel, quotes, owners) {
  let csv = '=== SALES PERFORMANCE REPORT ===\n';
  csv += `Generated Date,${new Date().toLocaleDateString()}\n\n`;

  csv += '=== PIPELINE STAGE BREAKDOWN ===\n';
  csv += 'Stage,Value\n';
  (pipeline || []).forEach((p) => {
    csv += `"${p.stage}",${p.value}\n`;
  });

  csv += '\n=== CONVERSION FUNNEL VOLUME ===\n';
  csv += 'Stage,Count\n';
  (funnel || []).forEach((f) => {
    csv += `"${f.stage}",${f.count}\n`;
  });

  csv += '\n=== QUOTATION STATUS SUMMARY ===\n';
  csv += 'Status,Count,Total Value\n';
  (quotes || []).forEach((q) => {
    csv += `"${q.status}",${q.count},${q.total_value}\n`;
  });

  csv += '\n=== SALES REP PERFORMANCE ===\n';
  csv += 'Sales Executive,Leads Owned,Deals Won,Won Revenue\n';
  (owners || []).forEach((o) => {
    csv += `"${o.name}",${o.leads_owned},${o.deals_won},${o.won_revenue}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SalesReport_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a formatted CSV file of Leads data.
 */
export function exportLeadsCSV(leads) {
  let csv = 'ID,Name,Company,Email,Phone,Status,Estimated Value,Owner\n';
  (leads || []).forEach((l) => {
    const name = l.name || l.customer?.name || '';
    const company = l.company || l.customer?.company || '';
    const email = l.email || l.customer?.email || '';
    const phone = l.phone || l.customer?.phone || '';
    const status = l.status || 'New';
    const val = l.value || l.estimated_value || 0;
    const owner = l.owner?.name || (typeof l.owner === 'string' ? l.owner : 'Alex Carter');
    csv += `"${l.id}","${name}","${company}","${email}","${phone}","${status}",${val},"${owner}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Leads_Export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a formatted CSV file of Opportunities data.
 */
export function exportOpportunitiesCSV(opportunities) {
  let csv = 'ID,Title,Company,Stage,Deal Value,Win Probability %,Close Date,Status\n';
  (opportunities || []).forEach((o) => {
    const title = o.title || '';
    const company = o.company || o.customer?.company || '';
    const stage = o.stage || '1. Qualification';
    const amount = o.value || o.amount || 0;
    const prob = o.prob || o.probability || 50;
    const closeDate = o.date || o.close_date || '';
    const status = o.status || 'Open';
    csv += `"${o.id}","${title}","${company}","${stage}",${amount},${prob},"${closeDate}","${status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Opportunities_Export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
