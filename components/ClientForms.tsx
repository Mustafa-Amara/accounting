"use client";
import { useState } from "react";
import { createClient, addPayment, createClientInvoice } from "@/lib/actions";

export function AddClient() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <form
      className="card flex flex-wrap items-end gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        try { await createClient({ name, phone, address }); setName(""); setPhone(""); setAddress(""); setMsg("تمت الاضافة"); }
        catch (err: unknown) { setMsg(err instanceof Error ? err.message : "خطأ"); }
      }}
    >
      <label>الاسم*<input value={name} onChange={(e) => setName(e.target.value)} className="w-48" /></label>
      <label>الهاتف<input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-36" /></label>
      <label>العنوان<input value={address} onChange={(e) => setAddress(e.target.value)} className="w-48" /></label>
      <button className="btn-primary btn">إضافة زبون</button>
      {msg && <span className="text-sm font-bold text-emerald-600">{msg}</span>}
    </form>
  );
}

export function QuickClientEntry({ clients }: { clients: { id: number; name: string }[] }) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? 0);
  const [mode, setMode] = useState<"debit" | "payment">("debit");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <form
      className="card flex flex-wrap items-end gap-2 border-blue-200"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          if (!clientId) throw new Error("اختر الزبون أولاً");
          if (mode === "debit") {
            await createClientInvoice({ clientId, amount: Number(amount), date, notes, label: "سحب من حساب الزبون" });
            setMsg("تم تسجيل السحب في كشف الحساب");
          } else {
            await addPayment({ clientId, amount: Number(amount), date, notes, method: "نقدي" });
            setMsg("تم تسجيل الدفعة وخصمها من الدين");
          }
          setAmount(0);
          setNotes("");
        } catch (err: unknown) {
          setMsg(err instanceof Error ? err.message : "خطأ");
        }
      }}
    >
      <label>الزبون<select value={clientId} onChange={(e) => setClientId(Number(e.target.value))} className="w-52">
        <option value={0}>اختر الزبون</option>
        {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
      </select></label>
      <label>نوع الحركة<select value={mode} onChange={(e) => setMode(e.target.value as "debit" | "payment")} className="w-32">
        <option value="debit">سحب / إجمالي</option>
        <option value="payment">دفعة</option>
      </select></label>
      <label>التاريخ<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" /></label>
      <label>المبلغ<input type="number" min={1} step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-32" /></label>
      <label>ملاحظات<input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-52" placeholder="اختياري" /></label>
      <button className="btn-primary btn">تسجيل الحركة</button>
      {msg && <span className="text-sm font-bold text-emerald-600">{msg}</span>}
    </form>
  );
}

export function ClientLedgerForm({ clientId, invoices }: { clientId: number; invoices: { id: number; number: string; remaining: number }[] }) {
  const [mode, setMode] = useState<"payment" | "debit">("payment");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceId, setInvoiceId] = useState<number | "">(invoices.filter((i) => i.remaining > 0)[0]?.id ?? "");
  const [method, setMethod] = useState("نقدي");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <form
      className="card flex flex-wrap items-end gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          if (mode === "debit") {
            await createClientInvoice({ clientId, amount: Number(amount), date, notes, label: notes || "سحب من حساب الزبون" });
            setMsg("تم تسجيل السحب");
          } else {
            await addPayment({ clientId, invoiceId: invoiceId === "" ? undefined : Number(invoiceId), amount: Number(amount), method, notes, date });
            setMsg("تم تسجيل الدفعة");
          }
          setAmount(0);
          setNotes("");
        } catch (err: unknown) { setMsg(err instanceof Error ? err.message : "خطأ"); }
      }}
    >
      <label>نوع الحركة<select value={mode} onChange={(e) => setMode(e.target.value as "payment" | "debit")} className="w-32">
        <option value="payment">دفع</option>
        <option value="debit">سحب</option>
      </select></label>
      <label>التاريخ<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" /></label>
      <label>المبلغ<input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-32" /></label>
      {mode === "payment" && (
        <label>الفاتورة<select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value === "" ? "" : Number(e.target.value))} className="w-52">
          <option value="">دفعة عامة للعميل</option>
          {invoices.filter((i) => i.remaining > 0).map((i) => <option key={i.id} value={i.id}>{i.number} (متبقي {i.remaining})</option>)}
        </select></label>
      )}
      {mode === "payment" && (
        <label>الطريقة<select value={method} onChange={(e) => setMethod(e.target.value)} className="w-28">
          <option>نقدي</option><option>تحويل</option><option>آجل</option>
        </select></label>
      )}
      <label>ملاحظات<input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-52" /></label>
      <button className="btn-green btn">{mode === "payment" ? "تسجيل دفعة" : "تسجيل سحب"}</button>
      {msg && <span className="text-sm font-bold text-emerald-600">{msg}</span>}
    </form>
  );
}

export function PayForm({ clientId, invoices }: { clientId: number; invoices: { id: number; number: string; remaining: number }[] }) {
  return <ClientLedgerForm clientId={clientId} invoices={invoices} />;
}
