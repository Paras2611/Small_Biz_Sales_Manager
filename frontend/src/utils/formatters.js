import { format, parseISO } from 'date-fns';

export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateStr, pattern = 'dd MMM yyyy') {
  if (!dateStr) return '—';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(date, pattern);
  } catch (e) {
    return dateStr;
  }
}

export function formatDateTime(dateStr) {
  return formatDate(dateStr, 'dd MMM yyyy, hh:mm a');
}

export function computeQuotationTotalsClient(lines, discountPct = 0) {
  let subtotal = 0;
  const computedLines = (lines || []).map((line) => {
    const qty = Number(line.qty) || 1;
    const unitPrice = Number(line.unit_price) || 0;
    const taxRate = Number(line.tax_rate) || 18.0;
    const lineTotal = Math.round(qty * unitPrice * 100) / 100;
    subtotal += lineTotal;
    return {
      ...line,
      qty,
      unit_price: unitPrice,
      tax_rate: taxRate,
      line_total: lineTotal,
    };
  });

  subtotal = Math.round(subtotal * 100) / 100;
  const discountRate = Number(discountPct) / 100;
  const discountAmount = Math.round(subtotal * discountRate * 100) / 100;
  const taxableAmount = Math.round((subtotal - discountAmount) * 100) / 100;

  let totalTax = 0;
  if (subtotal > 0) {
    const taxFactor = taxableAmount / subtotal;
    for (const cl of computedLines) {
      const lineTaxable = cl.line_total * taxFactor;
      const lineTax = lineTaxable * (cl.tax_rate / 100);
      totalTax += lineTax;
    }
  }
  const taxAmount = Math.round(totalTax * 100) / 100;
  const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return {
    subtotal,
    discount_pct: Number(discountPct),
    discount_amount: discountAmount,
    taxable_amount: taxableAmount,
    tax_amount: taxAmount,
    grand_total: grandTotal,
    lines: computedLines,
  };
}
