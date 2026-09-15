import ExcelJS from "exceljs";

export type ExcelLine = { name: string; qty: number; price: number; total: number };
export type InvoiceExcelInput = {
  number: string;
  date: string;
  company: { name: string; phone: string; address: string };
  client: { name: string; phone: string; address: string };
  lines: ExcelLine[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  remaining: number;
  currency: string;
  notes?: string;
};

const THIN: ExcelJS.BorderStyle = "thin";
const borderAll = (color = "FF9AA0A6"): Partial<ExcelJS.Borders> => ({
  top: { style: THIN, color: { argb: color } },
  bottom: { style: THIN, color: { argb: color } },
  left: { style: THIN, color: { argb: color } },
  right: { style: THIN, color: { argb: color } },
});

export async function buildInvoiceWorkbook(inv: InvoiceExcelInput): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = inv.company.name;
  (wb as any).views = [{ rightToLeft: true }];
  const ws = wb.addWorksheet("فاتورة") as ExcelJS.Worksheet & { printArea?: string };

  ws.columns = [
    { header: "", key: "c1", width: 8 },
    { header: "", key: "c2", width: 38 },
    { header: "", key: "c3", width: 14 },
    { header: "", key: "c4", width: 16 },
    { header: "", key: "c5", width: 18 },
  ];

  // ترويسة الشركة
  ws.mergeCells("A1:E1");
  const title = ws.getCell("A1");
  title.value = `فاتورة مبيعات — ${inv.company.name}`;
  title.font = { bold: true, size: 16, color: { argb: "FF1F2937" } };
  title.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 30;

  ws.mergeCells("A2:E2");
  const sub = ws.getCell("A2");
  sub.value = `${inv.company.address} — هاتف: ${inv.company.phone}`;
  sub.font = { size: 11, color: { argb: "FF6B7280" } };
  sub.alignment = { horizontal: "center" };

  ws.mergeCells("A3:E3");
  const meta = ws.getCell("A3");
  meta.value = `رقم الفاتورة: ${inv.number} — التاريخ: ${inv.date} — العميل: ${inv.client.name} (${inv.client.phone})`;
  meta.font = { bold: true, size: 12 };
  meta.alignment = { horizontal: "center" };
  meta.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
  ws.getRow(3).height = 22;

  // رأس الجدول
  const headerRow = ws.getRow(4);
  const headers = ["ت", "الصنف / المنتج", "الكمية", "السعر", `الإجمالي (${inv.currency})`];
  headers.forEach((h, i) => {
    const c = headerRow.getCell(i + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.border = borderAll("FF2563EB");
  });
  headerRow.height = 24;

  // الأسطر
  let r = 5;
  inv.lines.forEach((l, idx) => {
    const row = ws.getRow(r);
    const vals: (string | number)[] = [idx + 1, l.name, l.qty, l.price, l.total];
    vals.forEach((v, i) => {
      const c = row.getCell(i + 1);
      c.value = v;
      c.border = borderAll();
      c.alignment = { horizontal: i === 1 ? "right" : "center", vertical: "middle" };
      if (i >= 2) c.numFmt = "#,##0";
    });
    row.height = 20;
    r++;
  });

  const summary: [string, number, boolean?][] = [
    ["المجموع الفرعي", inv.subtotal, false],
    ["الخصم", inv.discount, false],
    ["الضريبة", inv.tax, false],
    ["الإجمالي الكلي", inv.total, true],
    ["المدفوع", inv.paid, true],
    ["المتبقي (دين)", inv.remaining, true],
  ];
  summary.forEach(([label, val, bold]) => {
    ws.mergeCells(`A${r}:D${r}`);
    const lc = ws.getCell(`A${r}`);
    lc.value = label;
    lc.font = { bold: !!bold, size: 12 };
    lc.alignment = { horizontal: "center", vertical: "middle" };
    lc.border = borderAll();
    const vc = ws.getCell(`E${r}`);
    vc.value = val;
    vc.numFmt = "#,##0";
    vc.font = { bold: !!bold, size: 12 };
    vc.alignment = { horizontal: "center" };
    vc.border = borderAll();
    if (label.includes("المتبقي")) {
      vc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFECACA" } };
      vc.font = { bold: true, color: { argb: "FFB91C1C" }, size: 13 };
    }
    ws.getRow(r).height = 22;
    r++;
  });

  if (inv.notes) {
    ws.mergeCells(`A${r}:E${r}`);
    const nc = ws.getCell(`A${r}`);
    nc.value = `ملاحظات: ${inv.notes}`;
    nc.alignment = { horizontal: "right" };
    r++;
  }

  ws.printArea = `A1:E${r}`;
  ws.pageSetup = { paperSize: 9, orientation: "portrait", fitToPage: true };
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

/** كشف حساب عميل / تقرير ديون — جدول عام */
export async function buildTableWorkbook(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  widths = [10, 30, 16, 18]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  (wb as any).views = [{ rightToLeft: true }];
  const ws = wb.addWorksheet("تقرير");
  const colCount = headers.length;
  widths.forEach((w, i) => ws.getColumn(i + 1).width = w);

  const lastCol = ws.getColumn(colCount).letter;
  ws.mergeCells(`A1:${lastCol}1`);
  const t = ws.getCell("A1");
  t.value = title;
  t.font = { bold: true, size: 15 };
  t.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 28;

  const hr = ws.getRow(2);
  headers.forEach((h, i) => {
    const c = hr.getCell(i + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.border = borderAll("FF059669");
  });
  hr.height = 24;

  rows.forEach((rowVals) => {
    const row = ws.addRow(rowVals);
    row.eachCell((c) => {
      c.border = borderAll();
      c.alignment = { horizontal: "center", vertical: "middle" };
    });
    row.height = 20;
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}
