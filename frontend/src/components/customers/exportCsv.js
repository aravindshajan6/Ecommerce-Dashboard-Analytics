import { fmtDate } from '../../lib/format.js';

const cell = (v) => {
  if (v == null) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(rows, columns) {
  const head = columns.map((c) => cell(c.header)).join(',');
  const body = rows.map((r) => columns.map((c) => cell(c.value(r))).join(',')).join('\n');
  return `${head}\n${body}`;
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const CUSTOMER_CSV_COLUMNS = [
  { header: 'ID', value: (r) => r.id },
  { header: 'Name', value: (r) => r.name },
  { header: 'Email', value: (r) => r.email },
  { header: 'Joined', value: (r) => (r.createdAt ? fmtDate(r.createdAt) : '') },
  { header: 'City', value: (r) => r.city },
  { header: 'Country', value: (r) => r.country },
  { header: 'Orders', value: (r) => r.orders },
  { header: 'Total spent', value: (r) => r.totalSpent },
  { header: 'AOV', value: (r) => r.aov },
  { header: 'Last order', value: (r) => (r.lastOrderAt ? fmtDate(r.lastOrderAt) : '') },
  { header: 'Segment', value: (r) => r.segment },
];
