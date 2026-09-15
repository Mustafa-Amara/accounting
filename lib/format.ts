export const fmtMoney = (n: number) =>
  new Intl.NumberFormat("ar-IQ", { maximumFractionDigits: 0 }).format(Math.round(n || 0));

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("ar-IQ", { year: "numeric", month: "2-digit", day: "2-digit" });

export function calcTotals(lines: { qty: number; price: number }[], discount = 0, tax = 0) {
  const subtotal = lines.reduce((s, l) => s + (l.qty || 0) * (l.price || 0), 0);
  const total = Math.max(0, subtotal - (discount || 0) + (tax || 0));
  return { subtotal, total };
}

export const statusOf = (total: number, paid: number) =>
  paid >= total ? "مدفوعة" : paid > 0 ? "جزئية" : "آجلة";
