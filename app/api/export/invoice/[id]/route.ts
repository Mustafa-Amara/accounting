import { prisma } from "@/lib/db";
import { buildInvoiceWorkbook } from "@/lib/excel";
import { fmtDate } from "@/lib/format";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const inv = await prisma.invoice.findUnique({
    where: { id: Number(params.id) },
    include: { client: true, items: true },
  });
  if (!inv) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const buf = await buildInvoiceWorkbook({
    number: inv.number,
    date: fmtDate(inv.date),
    company: {
      name: process.env.COMPANY_NAME ?? "شركتي",
      phone: process.env.COMPANY_PHONE ?? "",
      address: process.env.COMPANY_ADDRESS ?? "",
    },
    client: { name: inv.client.name, phone: inv.client.phone, address: inv.client.address },
    lines: inv.items.map((it) => ({ name: it.name, qty: it.qty, price: it.price, total: it.total })),
    subtotal: inv.subtotal,
    discount: inv.discount,
    tax: inv.tax,
    total: inv.total,
    paid: inv.paid,
    remaining: inv.remaining,
    currency: process.env.CURRENCY ?? "د.ع",
    notes: inv.notes,
  });
  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`فاتورة_${inv.number}.xlsx`)}`,
    },
  });
}
