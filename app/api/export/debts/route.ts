import { prisma } from "@/lib/db";
import { buildTableWorkbook } from "@/lib/excel";
import { NextResponse } from "next/server";

export async function GET() {
  const clients = await prisma.client.findMany({ include: { invoices: true }, orderBy: { name: "asc" } });
  const rows = clients
    .map((c) => [c.name, c.phone, c.invoices.filter((i) => i.remaining > 0).length, c.invoices.reduce((s, i) => s + i.total, 0), c.invoices.reduce((s, i) => s + i.remaining, 0)] as (string | number)[])
    .filter((r) => Number(r[4]) > 0)
    .sort((a, b) => Number(b[4]) - Number(a[4]));
  const buf = await buildTableWorkbook("تقرير الديون المستحقة", ["العميل", "الهاتف", "فواتير غير مسددة", "اجمالي الفواتير", "الدين المتبقي"], rows, [30, 16, 16, 18, 18]);
  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent("تقرير_الديون.xlsx")}`,
    },
  });
}
