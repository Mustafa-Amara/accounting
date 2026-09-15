import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "نظام الفواتير والديون",
  description: "إدارة الفواتير والديون والعملاء مع التصدير إلى إكسل",
};

function Nav() {
  const links = [
    ["/", "لوحة التحكم"],
    ["/invoices", "الفواتير"],
    ["/invoices/new", "+ فاتورة جديدة"],
    ["/clients", "الزبائن"],
    ["/suppliers", "الموردين"],
    ["/products", "الأدوية"],
    ["/products?cat=أدوية%20بيطرية", "أدوية بيطرية"],
    ["/reports/debts", "تقرير الديون"],
    ["/settings", "الإعدادات"],
  ] as const;
  return (
    <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
        <span className="me-3 text-lg font-extrabold text-blue-700">🧾 الفواتير والديون</span>
        {links.map(([href, label]) => (
          <a key={href} href={href} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700">
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-slate-100 font-cairo text-gray-900">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-xs text-gray-500">
          نظام الفواتير والديون — البيانات محفوظة محلياً (SQLite) • التصدير عبر ExcelJS
        </footer>
      </body>
    </html>
  );
}
