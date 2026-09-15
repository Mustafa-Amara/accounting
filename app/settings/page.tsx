import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";

async function backupDatabase() {
  "use server";

  const { execSync } = await import("node:child_process");
  execSync("node scripts/backup-db.mjs", { cwd: process.cwd(), stdio: "pipe" });
  revalidatePath("/settings");
}

async function restoreDatabase() {
  "use server";

  const { execSync } = await import("node:child_process");
  execSync("node scripts/restore-db.mjs", { cwd: process.cwd(), stdio: "pipe" });
  revalidatePath("/settings");
}

async function getBackupFiles() {
  const backupDir = path.join(process.cwd(), "db-backups");

  try {
    const files = await fs.readdir(backupDir);
    return files
      .filter((file) => file.endsWith(".db") || file.endsWith(".db-wal") || file.endsWith(".db-shm"))
      .sort()
      .reverse()
      .slice(0, 10);
  } catch {
    return [];
  }
}

export default async function SettingsPage() {
  const v = (k: string, d: string) => process.env[k] ?? d;
  const backupDir = path.join(process.cwd(), "db-backups");
  const backupFiles = await getBackupFiles();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">الاعدادات</h1>

      <div className="card space-y-2 text-sm">
        <p>بيانات الترويسة التي تظهر في ملف الاكسل تؤخذ من ملف <code>.env</code> في جذر المشروع:</p>
        <table className="table">
          <thead><tr><th>المفتاح</th><th>القيمة الحالية</th></tr></thead>
          <tbody>
            <tr><td>COMPANY_NAME</td><td className="font-bold">{v("COMPANY_NAME", "شركتي للتجارة")}</td></tr>
            <tr><td>COMPANY_PHONE</td><td>{v("COMPANY_PHONE", "")}</td></tr>
            <tr><td>COMPANY_ADDRESS</td><td>{v("COMPANY_ADDRESS", "")}</td></tr>
            <tr><td>CURRENCY</td><td>{v("CURRENCY", "د.ع")}</td></tr>
          </tbody>
        </table>
        <p className="text-gray-500">عدل ملف .env ثم اعد تشغيل السيرفر (npm run dev) لتظهر القيم الجديدة في الصادرات.</p>
      </div>

      <div className="card space-y-3 text-sm">
        <h2 className="font-extrabold">حفظ واسترجاع نسخة احتياطية</h2>

        <div className="flex flex-wrap gap-3">
          <form action={backupDatabase}>
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-500">
              حفظ نسخة قاعدة البيانات
            </button>
          </form>

          <form action={restoreDatabase}>
            <button type="submit" className="rounded bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-500">
              استرجاع آخر نسخة
            </button>
          </form>
        </div>

        <div className="rounded bg-gray-100 p-3 text-xs text-gray-700">
          <div className="mb-2 font-bold text-gray-800">مكان الملفات المحفوظة:</div>
          <code>{backupDir}</code>
        </div>

        <div>
          <div className="mb-2 font-bold text-gray-800">آخر النسخ المحفوظة:</div>
          {backupFiles.length === 0 ? (
            <p className="text-gray-500">لا توجد نسخ محفوظة حتى الآن.</p>
          ) : (
            <ul className="space-y-1 text-xs text-gray-700">
              {backupFiles.map((file) => (
                <li key={file} className="rounded bg-gray-50 px-2 py-1">{file}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card text-sm">
        <h2 className="mb-2 font-extrabold">اوامر قاعدة البيانات</h2>
        <pre className="overflow-auto rounded bg-gray-900 p-3 text-xs text-green-300" dir="ltr">npx prisma db push{"\n"}npm run db:seed{"\n"}npx prisma studio</pre>
      </div>
    </div>
  );
}
