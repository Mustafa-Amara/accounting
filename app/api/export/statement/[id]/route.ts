import { prisma } from "@/lib/db";
import { buildTableWorkbook } from "@/lib/excel";
import { fmtDate } from "@/lib/format";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const c = await prisma.client.findUnique({
    where: { id: Number(params.id) },
    include: { invoices: { orderBy: { id: "asc" } }, payments: { orderBy: { id: "asc" } } },
  });
  if (!c) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const rows: (string | number)[][] = [
    ...c.invoices.map((i) => [`فاتورة ${i.number}`, fmtDate(i.date), i.total, i.paid, i.remaining]),
    ...c.payments.map((p) => [`دفعة (${p.method})`, fmtDate(p.date), "", p.amount, ""]),
  ];
  const buf = await buildTableWorkbook(`كشف حساب — ${c.name}`, ["البيان", "التاريخ", "اجمالي الفاتورة", "المدفوع", "المتبقي"], rows, [30, 14, 16, 14, 16]);
  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`كشف_${c.name}.xlsx`)}`,
    },
  });
}
