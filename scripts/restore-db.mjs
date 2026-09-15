import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dbDir = path.join(rootDir, "prisma");
const backupDir = path.join(rootDir, "db-backups");

async function findLatestSnapshot() {
  const entries = await fs.readdir(backupDir, { withFileTypes: true });
  const dbFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".db"))
    .map((entry) => entry.name)
    .sort();

  if (dbFiles.length === 0) {
    throw new Error(`لم يتم العثور على أي نسخة احتياطية في: ${backupDir}`);
  }

  return dbFiles[dbFiles.length - 1];
}

async function restoreFromBackup() {
  const latestDbFile = await findLatestSnapshot();
  const latestDbPath = path.join(backupDir, latestDbFile);
  const targetDbPath = path.join(dbDir, "dev.db");

  await fs.copyFile(latestDbPath, targetDbPath);
  console.log(`✓ تم استرجاع قاعدة البيانات من: ${latestDbPath}`);

  const walFile = latestDbFile.replace(/\.db$/, ".db-wal");
  const shmFile = latestDbFile.replace(/\.db$/, ".db-shm");

  const walPath = path.join(backupDir, walFile);
  const shmPath = path.join(backupDir, shmFile);
  const targetWalPath = path.join(dbDir, "dev.db-wal");
  const targetShmPath = path.join(dbDir, "dev.db-shm");

  try {
    await fs.access(walPath);
    await fs.copyFile(walPath, targetWalPath);
    console.log(`✓ تم استرجاع WAL من: ${walPath}`);
  } catch {
    // Ignore if backup WAL does not exist.
  }

  try {
    await fs.access(shmPath);
    await fs.copyFile(shmPath, targetShmPath);
    console.log(`✓ تم استرجاع SHM من: ${shmPath}`);
  } catch {
    // Ignore if backup SHM does not exist.
  }
}

try {
  await restoreFromBackup();
} catch (error) {
  console.error(error instanceof Error ? error.message : "فشل في الاسترجاع");
  process.exit(1);
}
