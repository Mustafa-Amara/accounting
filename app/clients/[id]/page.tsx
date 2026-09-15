import { prisma } from "@/lib/db";
import { fmtMoney, fmtDate } from "@/lib/format";
import { ClientLedgerForm } from "@/components/ClientForms";
import { notFound } from "next/navigation";

export default async function ClientDetail({ params }: { params: { id: string } }) {
  const c = await prisma.client.findUnique({
    where: { id: Number(params.id) },
    include: { invoices: { orderBy: { id: "desc" } }, payments: { orderBy: { id: "desc" } } },
  });
  if (!c) return notFound();

  const debt = c.invoices.reduce((s, i) => s + i.remaining, 0);
  const paidTotal = c.payments.reduce((s, p) => s + p.amount, 0);

  const ledgerEntries = [
    ...c.invoices.map((invoice) => {
      const isDebit = invoice.number.startsWith("ACC-") || (invoice.notes || "").toLowerCase().includes("سحب");
      return {
        id: `invoice-${invoice.id}`,
        date: invoice.date,
        type: isDebit ? "سحب" : "فاتورة",
        reference: invoice.number,
        amount: invoice.total,
        sign: isDebit ? 1 : 1,
        note: invoice.notes || (isDebit ? "سحب من حساب الزبون" : "فاتورة عميل"),
        link: `/invoices/${invoice.id}`,
      };
    }),
    ...c.payments.map((payment) => ({
      id: `payment-${payment.id}`,
      date: payment.date,
      type: "دفعة",
      reference: payment.invoiceId ? `فاتورة ${payment.invoiceId}` : "دفعة عامة",
      amount: payment.amount,
      sign: -1,
      note: payment.notes || payment.method,
      link: null,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  const ledger = ledgerEntries.map((entry) => {
    runningBalance += entry.sign * entry.amount;
    return { ...entry, balance: runningBalance };
  });

  return (
    <div className="space-y-4">
      <a href="/clients" className="btn-ghost btn no-print w-fit">رجوع للزبائن</a>
      <div className="card">
        <h1 className="text-xl font-extrabold">{c.name}</h1>
        <div className="text-sm text-gray-600">{c.phone} - {c.address}</div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="text-xs text-red-700">الرصيد الحالي</div>
            <div className="text-xl font-black text-red-600">{fmtMoney(debt)}</div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="text-xs text-emerald-700">إجمالي المدفوعات</div>
            <div className="text-xl font-black text-emerald-600">{fmtMoney(paidTotal)}</div>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="text-xs text-blue-700">إجمالي الحركات</div>
            <div className="text-xl font-black text-blue-600">{ledger.length}</div>
          </div>
        </div>
        <div className="no-print mt-3"><a href={`/api/export/statement/${c.id}`} className="btn-green btn">تصدير كشف الحساب اكسل</a></div>
      </div>

      <ClientLedgerForm clientId={c.id} invoices={c.invoices.map((i) => ({ id: i.id, number: i.number, remaining: i.remaining }))} />

      <div className="card">
        <h2 className="mb-2 font-extrabold">كشف الحساب</h2>
        <table className="table">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>النوع</th>
              <th>المرجع</th>
              <th>المبلغ</th>
              <th>الوصف</th>
              <th>الرصيد</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((entry) => (
              <tr key={entry.id}>
                <td>{fmtDate(entry.date)}</td>
                <td className={entry.type === "دفعة" ? "font-bold text-emerald-600" : "font-bold text-red-600"}>{entry.type}</td>
                <td>{entry.reference}</td>
                <td className={entry.sign > 0 ? "font-bold text-red-600" : "font-bold text-emerald-600"}>
                  {entry.sign > 0 ? "+" : "-"}{fmtMoney(entry.amount)}
                </td>
                <td>{entry.note}</td>
                <td className={entry.balance >= 0 ? "font-bold text-red-600" : "font-bold text-emerald-600"}>{fmtMoney(entry.balance)}</td>
                <td>
                  {entry.link ? <a className="text-blue-600 underline" href={entry.link}>عرض</a> : "-"}
                </td>
              </tr>
            ))}
            {ledger.length === 0 && <tr><td colSpan={7} className="py-4 text-gray-400">لا توجد حركات</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="mb-2 font-extrabold">الفواتير</h2>
        <table className="table">
          <thead><tr><th>الرقم</th><th>التاريخ</th><th>الاجمالي</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {c.invoices.map((i) => (
              <tr key={i.id}><td className="font-bold">{i.number}</td><td>{fmtDate(i.date)}</td><td>{fmtMoney(i.total)}</td><td>{fmtMoney(i.paid)}</td><td className="font-bold text-red-600">{fmtMoney(i.remaining)}</td><td>{i.status}</td><td><a className="text-blue-600 underline" href={`/invoices/${i.id}`}>عرض</a></td></tr>
            ))}
            {c.invoices.length === 0 && <tr><td colSpan={7} className="py-4 text-gray-400">لا فواتير</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
