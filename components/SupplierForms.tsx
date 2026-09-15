"use client";
import { useState } from "react";
import { createSupplier, addSupplierPayment } from "@/lib/actions";

export function AddSupplier() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <form
      className="card flex flex-wrap items-end gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await createSupplier({ name, phone, address });
          setName("");
          setPhone("");
          setAddress("");
          setMsg("تمت الاضافة");
        } catch (err: unknown) {
          setMsg(err instanceof Error ? err.message : "خطأ");
        }
      }}
    >
      <label>الاسم*<input value={name} onChange={(e) => setName(e.target.value)} className="w-52" /></label>
      <label>الهاتف<input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-36" /></label>
      <label>العنوان<input value={address} onChange={(e) => setAddress(e.target.value)} className="w-52" /></label>
      <button className="btn-primary btn">اضافة مورد</button>
      {msg && <span className="text-sm font-bold text-emerald-600">{msg}</span>}
    </form>
  );
}

export function SupplierPaymentForm({ supplierId }: { supplierId: number }) {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState("نقدي");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <form
      className="card flex flex-wrap items-end gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await addSupplierPayment({ supplierId, amount: Number(amount), method, notes });
          setAmount(0);
          setMethod("نقدي");
          setNotes("");
          setMsg("تم تسجيل الدفعة");
        } catch (err: unknown) {
          setMsg(err instanceof Error ? err.message : "خطأ");
        }
      }}
    >
      <label>المبلغ<input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-32" /></label>
      <label>الطريقة<select value={method} onChange={(e) => setMethod(e.target.value)} className="w-28"><option>نقدي</option><option>تحويل</option><option>آجل</option></select></label>
      <label>ملاحظات<input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-52" /></label>
      <button className="btn-green btn">إضافة دفعة</button>
      {msg && <span className="text-sm font-bold text-emerald-600">{msg}</span>}
    </form>
  );
}
