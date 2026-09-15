import { prisma } from "@/lib/db";
import { fmtMoney, fmtDate } from "@/lib/format";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";

export default async function InvoiceView({ params }: { params: { id: string } }) {
  const inv = await prisma.invoice.findUnique({
    where: { id: Number(params.id) },
    include: { client: true, items: true, payments: true },
  });
  if (!inv) return notFound();
  return (
    <div className="space-y-4">
      <div className="no-print flex gap-2">
        <a href="/invoices" className="btn-ghost btn">→ رجوع</a>
        <a href={`/api/export/invoice/${inv.id}`} className="btn-green btn">⬇ تصدير إكسل</a>
        <PrintButton />
      </div>
      <div className="card">
        <h1 className="text-xl font-extrabold">فاتورة {inv.number}</h1>
        <div className="mt-1 text-sm text-gray-600">العميل: <b>{inv.client.name}</b> — {inv.client.phone} — التاريخ: {fmtDate(inv.date)} — الحالة: <b>{inv.status}</b></div>
        <table className="table mt-3">
          <thead><tr><th>ت</th><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
          <tbody>
            {inv.items.map((it, idx) => (
              <tr key={it.id}><td>{idx + 1}</td><td className="text-right font-semibold">{it.name}</td><td>{it.qty}</td><td>{fmtMoney(it.price)}</td><td className="font-bold">{fmtMoney(it.total)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold md:grid-cols-3">
          <div>الفرعي: {fmtMoney(inv.subtotal)}</div>
          <div>الخصم: {fmtMoney(inv.discount)}</div>
          <div>الضريبة: {fmtMoney(inv.tax)}</div>
          <div>الإجمالي: {fmtMoney(inv.total)}</div>
          <div>المدفوع: {fmtMoney(inv.paid)}</div>
          <div className="text-red-600">المتبقي (دين): {fmtMoney(inv.remaining)}</div>
        </div>
        {inv.notes && <div className="mt-2 text-sm">ملاحظات: {inv.notes}</div>}
      </div>
      <div className="card">
        <h2 className="mb-2 font-extrabold">الدفعات المرتبطة</h2>
        {inv.payments.length === 0 ? <div className="text-sm text-gray-400">لا دفعات</div> : (
          <table className="table">
            <thead><tr><th>التاريخ</th><th>المبلغ</th><th>الطريقة</th><th>ملاحظات</th></tr></thead>
            <tbody>{inv.payments.map((p) => <tr key={p.id}><td>{fmtDate(p.date)}</td><td>{fmtMoney(p.amount)}</td><td>{p.method}</td><td>{p.notes}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
