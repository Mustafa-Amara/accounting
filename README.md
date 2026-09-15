# نظام الفواتير والديون (عربي RTL)

Next.js 14 + Tailwind + Prisma (SQLite) + ExcelJS + Zustand/Zod.

## التشغيل
```powershell
cd C:\Users\DELL\Desktop\invoice-app
npm install
npx prisma db push
npm run db:seed
npm run dev
```
ثم افتح: http://localhost:3000

## الصفحات
- `/` لوحة التحكم — `/invoices` الفواتير — `/invoices/new` فاتورة جديدة
- `/clients` العملاء — `/clients/[id]` كشف حساب
- `/products` كتالوج بفئات (مستوحى من agroolkar)
- `/reports/debts` تقرير الديون — `/settings` الاعدادات

## التصدير لاكسل
- فاتورة: `/api/export/invoice/[id]`
- كشف عميل: `/api/export/statement/[id]`
- تقرير الديون: `/api/export/debts`

## حفظ قاعدة البيانات
- قاعدة البيانات SQLite محفوظة في ملف: `prisma/dev.db`
- كل تشغيل للتطبيق يخلق نسخة احتياطية تلقائياً قبل التشغيل
- يوجد أيضاً مراقبة دورية عبر الأمر: `npm run db:watch` لإنشاء نسخة كل 5 دقائق
- يمكن إنشاء نسخة يدويًا عبر الأمر: `npm run db:backup`
- يمكن استرجاع آخر نسخة محفوظة عبر الأمر: `npm run db:restore`
- جميع النسخ تُحفظ داخل مجلد: `db-backups/`
- يتم الاحتفاظ بأحدث 8 نسخ فقط، لتجنب تراكم الملفات بلا داعي
- هذا يضمن أن البيانات تبقى على القرص وتستطيع استعادتها عند أي مشكلة.

## ملاحظة agroolkar.com.ua/ar
تعذر قراءة الموقع آليا (حماية)، فاعتمدنا نمطه العام: فئات يمين + بطاقات منتجات + بحث.
عدل بيانات الترويسة من ملف `.env`.
