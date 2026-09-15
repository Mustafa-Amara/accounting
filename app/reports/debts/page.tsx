import { prisma } from "@/lib/db";
import { fmtMoney } from "@/lib/format";

export default async function DebtsReport() {
  const clients = await prisma.client.findMany({ include: { invoices: true }, orderBy: { name: "asc" } });
  const rows = clients
    .map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      count: c.invoices.filter((i) => i.remaining > 0).length,
      debt: c.invoices.reduce((s, i) => s + i.remaining, 0),
      total: c.invoices.reduce((s, i) => s + i.total, 0),
    }))
    .filter((r) => r.debt > 0)
    .sort((a, b) => b.debt - a.debt);
  const sum = rows.reduce((s, r) => s + r.debt, 0);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">تقرير الديون</h1>
        <a href="/api/export/debts" className="btn-green btn">تصدير اكسل</a>
      </div>
      <div className="card font-extrabold">اجمالي الديون المستحقة: <span className="text-red-600">{fmtMoney(sum)}</span> — عدد المدينين: {rows.length}</div>
      <table className="table">
        <thead><tr><th>#</th><th>العميل</th><th>الهاتف</th><th>فواتير غير مسددة</th><th>اجمالي الفواتير</th><th>الدين المتبقي</th><th></th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id}><td>{i + 1}</td><td className="font-bold">{r.name}</td><td>{r.phone}</td><td>{r.count}</td><td>{fmtMoney(r.total)}</td><td className="font-bold text-red-600">{fmtMoney(r.debt)}</td><td><a href={`/clients/${r.id}`} className="text-blue-600 underline">كشف الحساب</a></td></tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={7} className="py-6 text-gray-400">لا توجد ديون مستحقة — ممتاز</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
