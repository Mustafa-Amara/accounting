"use server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const LineSchema = z.object({
  productId: z.number().nullable().optional(),
  name: z.string().min(1),
  qty: z.number().positive(),
  price: z.number().min(0),
});
const InvoiceSchema = z.object({
  clientId: z.number().int().positive(),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  paid: z.number().min(0).default(0),
  notes: z.string().default(""),
  date: z.string().optional(),
  lines: z.array(LineSchema).min(1),
});

export async function createInvoice(input: z.infer<typeof InvoiceSchema>) {
  const data = InvoiceSchema.parse(input);
  const subtotal = data.lines.reduce((s, l) => s + l.qty * l.price, 0);
  const total = Math.max(0, subtotal - data.discount + data.tax);
  if (data.paid > total) throw new Error("المدفوع أكبر من الإجمالي");
  const remaining = total - data.paid;
  const status = remaining === 0 ? "مدفوعة" : data.paid > 0 ? "جزئية" : "آجلة";
  const count = await prisma.invoice.count();
  const invoiceDate = data.date ? new Date(data.date) : new Date();
  const number = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const inv = await prisma.invoice.create({
    data: {
      number,
      clientId: data.clientId,
      date: invoiceDate,
      subtotal,
      discount: data.discount,
      tax: data.tax,
      total,
      paid: data.paid,
      remaining,
      status,
      notes: data.notes,
      items: {
        create: data.lines.map((l) => ({
          productId: l.productId ?? null,
          name: l.name,
          qty: l.qty,
          price: l.price,
          total: l.qty * l.price,
        })),
      },
    },
  });

  if (data.paid > 0) {
    await prisma.payment.create({
      data: {
        clientId: data.clientId,
        invoiceId: inv.id,
        amount: data.paid,
        date: invoiceDate,
        method: "نقدي",
        notes: `دفعة فاتورة ${number}`,
      },
    });
  }

  revalidatePath("/invoices");
  revalidatePath("/clients");
  revalidatePath("/");
  return { id: inv.id, number };
}

export async function addPayment(input: { clientId: number; invoiceId?: number; amount: number; method?: string; notes?: string; date?: string }) {
  if (!input.amount || input.amount <= 0) throw new Error("المبلغ غير صالح");
  const date = input.date ? new Date(input.date) : new Date();

  if (input.invoiceId) {
    const inv = await prisma.invoice.findUnique({ where: { id: input.invoiceId } });
    if (!inv) throw new Error("الفاتورة غير موجودة");
    if (input.amount > inv.remaining) throw new Error("المبلغ المدخل أكبر من المتبقي للفاتورة");

    await prisma.payment.create({
      data: { clientId: input.clientId, invoiceId: inv.id, amount: input.amount, method: input.method ?? "نقدي", notes: input.notes ?? "", date },
    });

    const paid = inv.paid + input.amount;
    const remaining = Math.max(0, inv.total - paid);
    await prisma.invoice.update({
      where: { id: inv.id },
      data: { paid, remaining, status: remaining === 0 ? "مدفوعة" : "جزئية" },
    });

    revalidatePath("/invoices");
    revalidatePath("/");
    revalidatePath("/clients");
    return;
  }

  const invoices = await prisma.invoice.findMany({
    where: { clientId: input.clientId, remaining: { gt: 0 } },
    orderBy: { date: "asc" },
  });

  const totalDebt = invoices.reduce((sum, inv) => sum + inv.remaining, 0);
  if (input.amount > totalDebt) throw new Error("المبلغ المدخل أكبر من إجمالي الدين الحالي للعميل");

  let remainingAmount = input.amount;
  for (const inv of invoices) {
    if (remainingAmount <= 0) break;
    const apply = Math.min(inv.remaining, remainingAmount);
    remainingAmount -= apply;

    const paid = inv.paid + apply;
    const remaining = Math.max(0, inv.total - paid);
    await prisma.invoice.update({
      where: { id: inv.id },
      data: { paid, remaining, status: remaining === 0 ? "مدفوعة" : "جزئية" },
    });

    await prisma.payment.create({
      data: { clientId: input.clientId, invoiceId: inv.id, amount: apply, method: input.method ?? "نقدي", notes: input.notes ?? "", date },
    });
  }

  revalidatePath("/invoices");
  revalidatePath("/");
  revalidatePath("/clients");
}

export async function createClientInvoice(input: { clientId: number; amount: number; notes?: string; date?: string; label?: string }) {
  const amount = Number(input.amount);
  if (!amount || amount <= 0) throw new Error("المبلغ غير صالح");

  const count = await prisma.invoice.count();
  const number = `ACC-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
  const date = input.date ? new Date(input.date) : new Date();

  const invoice = await prisma.invoice.create({
    data: {
      number,
      clientId: input.clientId,
      date,
      subtotal: amount,
      discount: 0,
      tax: 0,
      total: amount,
      paid: 0,
      remaining: amount,
      status: "آجلة",
      notes: input.notes ?? input.label ?? "سحب من حساب الزبون",
      items: {
        create: [{
          name: input.label ?? "سحب من حساب الزبون",
          qty: 1,
          price: amount,
          total: amount,
        }],
      },
    },
  });

  revalidatePath("/invoices");
  revalidatePath("/");
  revalidatePath("/clients");
  return invoice;
}

export async function createClient(input: { name: string; phone?: string; address?: string; notes?: string }) {
  const cleanName = input.name.trim();
  if (!cleanName) throw new Error("اسم العميل مطلوب");

  const candidates = await prisma.client.findMany({
    where: { name: { contains: cleanName } },
  });

  const existing = candidates.find((client) => client.name.trim().toLowerCase() === cleanName.toLowerCase());

  if (existing) {
    revalidatePath("/clients");
    revalidatePath("/");
    return existing;
  }

  const c = await prisma.client.create({
    data: { name: cleanName, phone: input.phone ?? "", address: input.address ?? "", notes: input.notes ?? "" },
  });
  revalidatePath("/clients");
  revalidatePath("/");
  return c;
}

export async function createSupplier(input: { name: string; phone?: string; address?: string; notes?: string }) {
  if (!input.name.trim()) throw new Error("اسم المورد مطلوب");
  const s = await prisma.supplier.create({
    data: { name: input.name.trim(), phone: input.phone ?? "", address: input.address ?? "", notes: input.notes ?? "" },
  });
  revalidatePath("/suppliers");
  revalidatePath("/");
  return s;
}

export async function addSupplierPayment(input: { supplierId: number; amount: number; method?: string; notes?: string }) {
  if (!input.amount || input.amount <= 0) throw new Error("المبلغ غير صالح");
  const payment = await prisma.supplierPayment.create({
    data: { supplierId: input.supplierId, amount: input.amount, method: input.method ?? "نقدي", notes: input.notes ?? "" },
  });
  revalidatePath("/suppliers");
  return payment;
}

export async function createProduct(input: { nameAr: string; category?: string; price: number; unit?: string; stock?: number }) {
  if (!input.nameAr.trim()) throw new Error("اسم المنتج مطلوب");
  const p = await prisma.product.create({
    data: { nameAr: input.nameAr.trim(), category: input.category ?? "عام", price: input.price || 0, unit: input.unit ?? "قطعة", stock: input.stock ?? 0 },
  });
  revalidatePath("/products");
  revalidatePath("/");
  return p;
}
