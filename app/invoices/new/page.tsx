import { prisma } from "@/lib/db";
import Builder from "@/components/InvoiceBuilder";

export default async function NewInvoicePage() {
  const [clients, products] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ orderBy: { nameAr: "asc" } }),
  ]);
  const categories = Array.from(new Set(products.map((p) => p.category)));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">فاتورة جديدة</h1>
      {clients.length === 0 ? (
        <div className="card">لا يوجد عملاء بعد — <a className="text-blue-600 underline" href="/clients">أضف عميلاً أولاً</a></div>
      ) : (
        <Builder clients={clients} products={products} categories={categories} />
      )}
    </div>
  );
}
