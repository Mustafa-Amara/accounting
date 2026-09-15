import { prisma } from "@/lib/db";
import { fmtMoney, fmtDate } from "@/lib/format";
import { SupplierPaymentForm } from "@/components/SupplierForms";
import { notFound } from "next/navigation";

export default async function SupplierDetail({ params }: { params: { id: string } }) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: Number(params.id) },
    include: { payments: { orderBy: { date: "desc" } } },
  });

  if (!supplier) return notFound();

  const totalPaid = supplier.payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      <a href="/suppliers" className="btn-ghost btn no-print w-fit">رجوع للموردين</a>
      <div className="card">
        <h1 className="text-xl font-extrabold">{supplier.name}</h1>
        <div className="text-sm text-gray-600">{supplier.phone} - {supplier.address}</div>
        <div className="mt-2 font-bold">إجمالي المدفوعات: <span className="text-emerald-600">{fmtMoney(totalPaid)}</span></div>
      </div>

      <SupplierPaymentForm supplierId={supplier.id} />

      <div className="card">
        <h2 className="mb-2 font-extrabold">دفعات المورد</h2>
        <table className="table">
          <thead><tr><th>التاريخ</th><th>المبلغ</th><th>الطريقة</th><th>ملاحظات</th></tr></thead>
          <tbody>
            {supplier.payments.map((p) => (
              <tr key={p.id}><td>{fmtDate(p.date)}</td><td>{fmtMoney(p.amount)}</td><td>{p.method}</td><td>{p.notes}</td></tr>
            ))}
            {supplier.payments.length === 0 && <tr><td colSpan={4} className="py-4 text-gray-400">لا توجد دفعات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
