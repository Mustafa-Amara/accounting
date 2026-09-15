import { spawn } from "node:child_process";

const intervalMs = 5 * 60 * 1000;

function runBackup() {
  const child = spawn("node", ["scripts/backup-db.mjs"], {
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code) => {
    if (code === 0) {
      console.log(`✅ نسخة احتياطية تم إنجازها في ${new Date().toLocaleString("ar-EG")}`);
      return;
    }

    console.error(`❌ فشل في النسخ الاحتياطي في ${new Date().toLocaleString("ar-EG")}`);
  });
}

console.log(`🕒 سيتم إنشاء نسخة احتياطية كل ${intervalMs / 60000} دقيقة.`);
runBackup();
setInterval(runBackup, intervalMs);
