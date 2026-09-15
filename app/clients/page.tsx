import { prisma } from "@/lib/db";
import { fmtMoney } from "@/lib/format";
import { AddClient, QuickClientEntry } from "@/components/ClientForms";

export default async function ClientsPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q ?? "";
  const clients = await prisma.client.findMany({
    where: q ? { name: { contains: q } } : {},
    include: { invoices: true },
    orderBy: { id: "desc" },
  });

  const totalDebt = clients.reduce((sum, c) => sum + c.invoices.reduce((s, i) => s + i.remaining, 0), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">لوحة الزبائن</h1>

      <div className="grid gap-3 md:grid-cols-4">
        <a href="/invoices/new" className="card block border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100">
          <div className="text-sm opacity-80">تسجيل فاتورة</div>
          <div className="mt-2 text-xl font-black">+ فاتورة جديدة</div>
        </a>
        <a href="/clients#add-client" className="card block border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100">
          <div className="text-sm opacity-80">إضافة زبون</div>
          <div className="mt-2 text-xl font-black">+ زبون جديد</div>
        </a>
        <a href="#customers" className="card block border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100">
          <div className="text-sm opacity-80">تسجيل دفعة</div>
          <div className="mt-2 text-xl font-black">دفعة / سحب</div>
        </a>
        <a href="#customers" className="card block border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100">
          <div className="text-sm opacity-80">كشف حساب زبون</div>
          <div className="mt-2 text-xl font-black">اختيار الزبون</div>
        </a>
        <div className="card border-amber-200 bg-amber-50 text-amber-900">
          <div className="text-sm opacity-80">إجمالي الديون</div>
          <div className="mt-2 text-xl font-black">{fmtMoney(totalDebt)}</div>
        </div>
      </div>

      <div id="add-client" className="space-y-2">
        <h2 className="text-lg font-extrabold">إضافة زبون</h2>
        <AddClient />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-extrabold">تسجيل حركة زبون</h2>
        <p className="text-sm text-gray-500">اختر الزبون وسجل السحب أو الدفعة، وستظهر الحركة مباشرة في كشف حسابه.</p>
        <QuickClientEntry clients={clients.map((client) => ({ id: client.id, name: client.name }))} />
      </div>

      <form className="card flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="بحث عن زبون..." className="w-64" />
        <button className="btn-ghost btn">بحث</button>
        <a href="/api/export/debts" className="btn-green btn">تصدير تقرير الديون اكسل</a>
      </form>

      <div id="customers">
        <h2 className="mb-2 text-lg font-extrabold">اختيار الزبون</h2>
      <table className="table">
        <thead><tr><th>الزبون</th><th>الهاتف</th><th>الفواتير</th><th>إجمالي الدين</th><th>إجراءات</th></tr></thead>
        <tbody>
          {clients.map((c) => {
            const debt = c.invoices.reduce((s, i) => s + i.remaining, 0);
            return (
              <tr key={c.id}>
                <td className="font-bold">{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.invoices.length}</td>
                <td className="font-bold text-red-600">{fmtMoney(debt)}</td>
                <td className="space-x-2 space-x-reverse">
                  <a href={`/clients/${c.id}`} className="text-blue-600 underline">كشف الحساب</a>
                  <a href={`/clients/${c.id}`} className="text-emerald-600 underline">دفعة / سحب</a>
                </td>
              </tr>
            );
          })}
          {clients.length === 0 && <tr><td colSpan={5} className="py-6 text-gray-400">لا يوجد زبائن بعد</td></tr>}
        </tbody>
      </table>
      </div>
    </div>
  );
}
