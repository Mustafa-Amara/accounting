import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dbDir = path.join(rootDir, "prisma");
const backupDir = path.join(rootDir, "db-backups");
const MAX_BACKUPS = 8;

const dbFiles = ["dev.db", "dev.db-wal", "dev.db-shm"];
const label = new Date().toISOString().replace(/[:.]/g, "-");

async function copyIfExists(fileName) {
  const source = path.join(dbDir, fileName);
  const destination = path.join(backupDir, `${label}-${fileName}`);

  try {
    await fs.access(source);
    await fs.copyFile(source, destination);
    console.log(`✓ تم النسخ: ${fileName} -> ${destination}`);
  } catch {
    // Ignore missing DB parts.
  }
}

async function pruneOldBackups() {
  const entries = await fs.readdir(backupDir, { withFileTypes: true });
  const backupFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();

  const overLimit = backupFiles.length - MAX_BACKUPS;
  if (overLimit <= 0) return;

  for (const file of backupFiles.slice(0, overLimit)) {
    await fs.unlink(path.join(backupDir, file));
    console.log(`🗑️ تم حذف النسخة القديمة: ${file}`);
  }
}

try {
  await fs.mkdir(backupDir, { recursive: true });

  for (const fileName of dbFiles) {
    await copyIfExists(fileName);
  }

  await pruneOldBackups();

  console.log(`تم إنشاء نسخة احتياطية في: ${backupDir}`);
} catch (error) {
  console.error("فشل إنشاء النسخة الاحتياطية:", error);
  process.exit(1);
}
