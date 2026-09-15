"use client";
import { useMemo, useState } from "react";
import { createClient, createInvoice } from "@/lib/actions";

type Line = { productId: number | null; name: string; qty: number; price: number };
type Props = {
  clients: { id: number; name: string }[];
  products: { id: number; nameAr: string; price: number; category: string; unit: string }[];
  categories: string[];
};

export default function Builder({ clients: initialClients, products, categories }: Props) {
  const [clients, setClients] = useState(initialClients);
  const [clientId, setClientId] = useState<number>(initialClients[0]?.id ?? 0);
  const [clientName, setClientName] = useState(initialClients[0]?.name ?? "");
  const [clientPhone, setClientPhone] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [cat, setCat] = useState("الكل");
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: null, name: "", qty: 1, price: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paid, setPaid] = useState(0);
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");

  const filtered = useMemo(
    () => products.filter((p) => (cat === "الكل" || p.category === cat) && p.nameAr.includes(search.trim())),
    [products, cat, search]
  );
  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const total = Math.max(0, subtotal - discount + tax);
  const remaining = total - paid;

  const addLine = (p?: { id: number; nameAr: string; price: number }) =>
    setLines((ls) => [...ls, p ? { productId: p.id, name: p.nameAr, qty: 1, price: p.price } : { productId: null, name: "", qty: 1, price: 0 }]);

  async function addNewClient() {
    const cleanName = clientName.trim();
    if (!cleanName) {
      setMsg("اكتب اسم العميل أولا");
      return;
    }

    try {
      const c = await createClient({ name: cleanName, phone: clientPhone || undefined });
      setClients((prev) => {
        if (prev.some((x) => x.id === c.id)) return prev;
        return [...prev, { id: c.id, name: c.name }];
      });
      setClientId(c.id);
      setClientName(c.name);
      setClientPhone("");
      setMsg("تم حفظ العميل الجديد");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "خطأ في حفظ العميل");
    }
  }

  async function save() {
    setMsg("");
    try {
      const cleanName = clientName.trim();
      let finalClientId = clientId;

      if (!finalClientId && cleanName) {
        const c = await createClient({ name: cleanName, phone: clientPhone || undefined });
        finalClientId = c.id;
        setClients((prev) => [...prev.filter((x) => x.id !== c.id), { id: c.id, name: c.name }]);
      }

      if (!finalClientId) return setMsg("اختر أو اكتب اسم العميل أولا");

      const clean = lines.filter((l) => l.name.trim() && l.qty > 0);
      if (!clean.length) return setMsg("اضف صنفا واحدا على الاقل");

      const res = await createInvoice({ clientId: finalClientId, discount, tax, paid, notes, date: invoiceDate, lines: clean });
      window.location.href = `/invoices/${res.id}`;
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : "خطأ غير متوقع"); }
  }

  const upd = (i: number, k: keyof Line, v: string | number | null) =>
    setLines((ls) => ls.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card lg:col-span-1">
        <h2 className="mb-2 font-extrabold">كتالوج المنتجات</h2>
        <input placeholder="بحث عن منتج..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2 w-full" />
        <div className="mb-3 flex flex-wrap gap-1">
          {["الكل", ...categories].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1 text-xs font-bold ${cat === c ? "bg-blue-600 text-white" : "bg-gray-100"}`}>{c}</button>
          ))}
        </div>
        <div className="grid max-h-[420px] grid-cols-1 gap-2 overflow-auto">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border p-2">
              <div><div className="font-bold">{p.nameAr}</div>
              <div className="text-xs text-gray-500">{p.category} - {p.price} / {p.unit}</div></div>
              <button className="btn-ghost btn !px-3" onClick={() => addLine(p)}>+ اضافة</button>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-sm text-gray-400">لا نتائج — اكتب يدويا في الاسطر.</div>}
        </div>
      </div>
      <div className="card lg:col-span-2">
        <h2 className="mb-2 font-extrabold">فاتورة جديدة</h2>

        <div className="mb-3 grid gap-2 md:grid-cols-2">
          <label className="block">
            اسم العميل
            <input
              list="client-list"
              value={clientName}
              onChange={(e) => {
                setClientName(e.target.value);
                const match = clients.find((c) => c.name === e.target.value.trim());
                setClientId(match?.id ?? 0);
              }}
              placeholder="اكتب اسم العميل أو اختاره"
              className="w-full"
            />
            <datalist id="client-list">
              {clients.map((c) => <option key={c.id} value={c.name} />)}
            </datalist>
          </label>

          <label className="block">
            الهاتف
            <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="اختياري" className="w-full" />
          </label>

          <label className="block md:col-span-2">
            التاريخ
            <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full" />
          </label>
        </div>

        <div className="mb-3 flex gap-2">
          <button type="button" onClick={addNewClient} className="btn-ghost btn">+ حفظ عميل جديد</button>
          <button type="button" onClick={() => setClientId(0)} className="btn-ghost btn">إلغاء اختيار</button>
        </div>

        <table className="table">
          <thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الاجمالي</th><th></th></tr></thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td><input value={l.name} placeholder="اسم الصنف" onChange={(e) => upd(i, "name", e.target.value)} className="w-40" /></td>
                <td><input type="number" min={0.01} step="any" value={l.qty} onChange={(e) => upd(i, "qty", Number(e.target.value))} className="w-20 text-center" /></td>
                <td><input type="number" min={0} step="any" value={l.price} onChange={(e) => upd(i, "price", Number(e.target.value))} className="w-24 text-center" /></td>
                <td className="font-bold">{(l.qty * l.price).toLocaleString("ar-IQ")}</td>
                <td><button className="text-red-600" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}>حذف</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={() => addLine()} className="btn-ghost btn mt-2">+ سطر جديد</button>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <label>خصم<input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-full" /></label>
          <label>ضريبة<input type="number" min={0} value={tax} onChange={(e) => setTax(Number(e.target.value))} className="w-full" /></label>
          <label>المدفوع<input type="number" min={0} value={paid} onChange={(e) => setPaid(Number(e.target.value))} className="w-full" /></label>
          <label>ملاحظات<input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full" /></label>
        </div>
        <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm font-bold">
          الفرعي: {subtotal.toLocaleString("ar-IQ")} - الاجمالي: {total.toLocaleString("ar-IQ")} - المدفوع: {paid.toLocaleString("ar-IQ")} - <span className="text-red-600">المتبقي: {remaining.toLocaleString("ar-IQ")}</span>
        </div>
        {msg && <div className="mt-2 text-sm font-bold text-red-600">{msg}</div>}
        <div className="no-print mt-3 flex gap-2">
          <button onClick={save} className="btn-primary btn">حفظ الفاتورة</button>
          <a href="/invoices" className="btn-ghost btn">الغاء</a>
        </div>
      </div>
    </div>
  );
}
