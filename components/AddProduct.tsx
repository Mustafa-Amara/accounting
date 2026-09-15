"use client";
import { useState } from "react";
import { createProduct } from "@/lib/actions";

export default function AddProduct({ categories }: { categories: string[] }) {
  const [f, setF] = useState({ nameAr: "", category: "عام", price: 0, unit: "قطعة", stock: 0 });
  const [msg, setMsg] = useState("");
  const set = (k: keyof typeof f, v: string | number) => setF((s) => ({ ...s, [k]: v }));
  return (
    <form
      className="card flex flex-wrap items-end gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        try { await createProduct({ ...f, price: Number(f.price), stock: Number(f.stock) }); setF({ nameAr: "", category: "عام", price: 0, unit: "قطعة", stock: 0 }); setMsg("تمت الاضافة"); }
        catch (err: unknown) { setMsg(err instanceof Error ? err.message : "خطأ"); }
      }}
    >
      <label>اسم المنتج*<input value={f.nameAr} onChange={(e) => set("nameAr", e.target.value)} className="w-52" /></label>
      <label>الفئة<input list="cats" value={f.category} onChange={(e) => set("category", e.target.value)} className="w-32" />
        <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></label>
      <label>السعر<input type="number" min={0} value={f.price} onChange={(e) => set("price", Number(e.target.value))} className="w-28" /></label>
      <label>الوحدة<input value={f.unit} onChange={(e) => set("unit", e.target.value)} className="w-24" /></label>
      <label>المخزون<input type="number" value={f.stock} onChange={(e) => set("stock", Number(e.target.value))} className="w-24" /></label>
      <button className="btn-primary btn">اضافة منتج</button>
      {msg && <span className="text-sm font-bold text-emerald-600">{msg}</span>}
    </form>
  );
}
