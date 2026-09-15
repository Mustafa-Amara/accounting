import { prisma } from "@/lib/db";
import { fmtMoney } from "@/lib/format";

export default async function Dashboard() {
  const [invCount, invAgg, payAgg, clients, recent] = await Promise.all([
    prisma.invoice.count(),
    prisma.invoice.aggregate({ _sum: { total: true, paid: true, remaining: true } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.client.count(),
    prisma.invoice.findMany({ include: { client: true }, orderBy: { id: "desc" }, take: 6 }),
  ]);
  const total = invAgg._sum.total || 0;
  const debt = invAgg._sum.remaining || 0;
  const cards = [
    ["💰 إجمالي المبيعات", fmtMoney(total), "bg-blue-600"],
    ["⚠️ إجمالي الديون المستحقة", fmtMoney(debt), "bg-red-600"],
    ["🧾 عدد الفواتير", String(invCount), "bg-emerald-600"],
    ["👥 عدد العملاء", String(clients), "bg-amber-600"],
  ];
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">لوحة التحكم</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([t, v, c]) => (
          <div key={t} className={`rounded-2xl p-4 text-white shadow ${c}`}>
            <div className="text-sm opacity-90">{t}</div>
            <div className="mt-1 text-2xl font-extrabold">{v}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 className="mb-3 font-extrabold">أحدث الفواتير</h2>
        <table className="table">
          <thead><tr><th>الرقم</th><th>العميل</th><th>الإجمالي</th><th>المتبقي</th><th>الحالة</th><th>عرض</th></tr></thead>
          <tbody>
            {recent.map((i) => (
              <tr key={i.id}>
                <td className="font-bold">{i.number}</td>
                <td>{i.client.name}</td>
                <td>{fmtMoney(i.total)}</td>
                <td className="font-bold text-red-600">{fmtMoney(i.remaining)}</td>
                <td><span className="badge bg-gray-100">{i.status}</span></td>
                <td><a className="text-blue-600 underline" href={`/invoices/${i.id}`}>عرض</a></td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td colSpan={6} className="py-6 text-gray-400">لا توجد فواتير بعد — <a className="text-blue-600 underline" href="/invoices/new">أنشئ أول فاتورة</a></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="text-sm text-gray-500">إجمالي المدفوعات المسجلة: {fmtMoney(payAgg._sum.amount || 0)}</div>
    </div>
  );
}
