import { prisma } from "@/lib/db";
import { fmtMoney, fmtDate } from "@/lib/format";

export default async function InvoicesPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  const q = searchParams.q ?? "";
  const status = searchParams.status ?? "";
  const invoices = await prisma.invoice.findMany({
    include: { client: true },
    where: {
      ...(status ? { status } : {}),
      ...(q ? { OR: [{ number: { contains: q } }, { client: { name: { contains: q } } }] } : {}),
    },
    orderBy: { id: "desc" },
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">الفواتير</h1>
        <a href="/invoices/new" className="btn-primary btn">+ فاتورة جديدة</a>
      </div>
      <form className="no-print card flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="بحث برقم الفاتورة أو اسم العميل..." className="w-64" />
        <select name="status" defaultValue={status}>
          <option value="">كل الحالات</option>
          <option value="مدفوعة">مدفوعة</option>
          <option value="جزئية">جزئية</option>
          <option value="آجلة">آجلة</option>
        </select>
        <button className="btn-ghost btn">بحث</button>
      </form>
      <table className="table">
        <thead><tr><th>الرقم</th><th>العميل</th><th>التاريخ</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th><th></th></tr></thead>
        <tbody>
          {invoices.map((i) => (
            <tr key={i.id}>
              <td className="font-bold">{i.number}</td>
              <td>{i.client.name}</td>
              <td>{fmtDate(i.date)}</td>
              <td>{fmtMoney(i.total)}</td>
              <td>{fmtMoney(i.paid)}</td>
              <td className="font-bold text-red-600">{fmtMoney(i.remaining)}</td>
              <td><span className="badge bg-gray-100">{i.status}</span></td>
              <td className="whitespace-nowrap">
                <a className="text-blue-600 underline" href={`/invoices/${i.id}`}>عرض</a>{" | "}
                <a className="text-emerald-600 underline" href={`/api/export/invoice/${i.id}`}>إكسل ⬇</a>
              </td>
            </tr>
          ))}
          {invoices.length === 0 && <tr><td colSpan={8} className="py-6 text-gray-400">لا توجد فواتير مطابقة</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
