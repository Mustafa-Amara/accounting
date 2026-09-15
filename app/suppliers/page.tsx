import { prisma } from "@/lib/db";
import { fmtMoney } from "@/lib/format";
import { AddSupplier } from "@/components/SupplierForms";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    include: { payments: true },
    orderBy: { id: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">الموردون</h1>
      <AddSupplier />
      <table className="table">
        <thead><tr><th>المورد</th><th>الهاتف</th><th>العنوان</th><th>إجمالي المدفوعات</th><th></th></tr></thead>
        <tbody>
          {suppliers.map((s) => {
            const paid = s.payments.reduce((sum, p) => sum + p.amount, 0);
            return (
              <tr key={s.id}>
                <td className="font-bold">{s.name}</td>
                <td>{s.phone}</td>
                <td>{s.address}</td>
                <td>{fmtMoney(paid)}</td>
                <td><a href={`/suppliers/${s.id}`} className="text-blue-600 underline">كشف الحساب</a></td>
              </tr>
            );
          })}
          {suppliers.length === 0 && <tr><td colSpan={5} className="py-6 text-gray-400">لا موردين بعد</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
