import { prisma } from "@/lib/db";
import AddProduct from "@/components/AddProduct";

export default async function ProductsPage({ searchParams }: { searchParams: { q?: string; cat?: string } }) {
  const q = searchParams.q ?? "";
  const cat = searchParams.cat ?? "";
  const products = await prisma.product.findMany({
    where: {
      ...(cat ? { category: cat } : {}),
      ...(q ? { nameAr: { contains: q } } : {}),
    },
    orderBy: { nameAr: "asc" },
  });
  const categories = Array.from(new Set((await prisma.product.findMany({ select: { category: true } })).map((p) => p.category)));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">كتالوج الأدوية</h1>
      <div className="card flex flex-wrap gap-2">
        <a href="/products" className={`btn ${!cat ? "btn-primary" : "btn-ghost"}`}>كل الأدوية</a>
        <a href="/products?cat=أدوية%20بيطرية" className={`btn ${cat === "أدوية بيطرية" ? "btn-primary" : "btn-ghost"}`}>أدوية بيطرية</a>
      </div>
      <AddProduct categories={categories} />
      <form className="card flex gap-2">
        <input name="q" defaultValue={q} placeholder="بحث..." className="w-56" />
        <select name="cat" defaultValue={cat}>
          <option value="">كل الفئات</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn-ghost btn">بحث</button>
      </form>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="card">
            <div className="text-xs text-gray-500">{p.category}</div>
            <div className="font-extrabold">{p.nameAr}</div>
            <div className="mt-1 text-sm font-bold text-blue-700">{p.price.toLocaleString("ar-IQ")} / {p.unit}</div>
            <div className="text-xs text-gray-500">مخزون: {p.stock}</div>
          </div>
        ))}
        {products.length === 0 && <div className="card text-gray-400">لا منتجات — اضف من الاعلى</div>}
      </div>
    </div>
  );
}
