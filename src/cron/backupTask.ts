import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { EnvConfig, DatabaseConnection } from "../utils/env.ts";
import { backupLogger } from "../utils/logger.ts";
import { sendBackupNotification } from "../mail/mailer.ts";

const buildTimestamp = (): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  return [
    now.getFullYear(),
    "-",
    pad(now.getMonth() + 1),
    "-",
    pad(now.getDate()),
    "_",
    pad(now.getHours()),
    "-",
    pad(now.getMinutes()),
    "-",
    pad(now.getSeconds()),
  ].join("");
};

const ensureDirectory = (dirPath: string): void => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
    backupLogger.info(`Created backup directory: ${dirPath}`);
  }
};

type SpawnConfig = {
  command: string[];
  env?: Record<string, string>;
};

const buildMysqlDump = (db: DatabaseConnection): SpawnConfig => ({
  command: [
    "mysqldump",
    "--skip-ssl",
    "-h",
    db.host,
    "-P",
    String(db.port),
    "-u",
    db.user,
    `-p${db.password}`,
    db.database,
  ],
});

const buildPgDump = (db: DatabaseConnection): SpawnConfig => ({
  command: [
    "pg_dump",
    "-h",
    db.host,
    "-p",
    String(db.port),
    "-U",
    db.user,
    "-d",
    db.database,
  ],
  env: { PGPASSWORD: db.password },
});

const buildDumpCommand = (db: DatabaseConnection): SpawnConfig =>
  db.type === "postgres" ? buildPgDump(db) : buildMysqlDump(db);

export const runBackup = async (config: EnvConfig): Promise<void> => {
  const backupDir = config.BACKUP_PATH;
  ensureDirectory(backupDir);

  const filename = `backup_${buildTimestamp()}.sql`;
  const outputPath = join(backupDir, filename);

  const { host, port, database, type } = config.db;
  const toolName = type === "postgres" ? "pg_dump" : "mysqldump";

  backupLogger.info(
    `Starting ${toolName} backup of "${database}" on ${host}:${port}...`
  );

  try {
    const { command, env } = buildDumpCommand(config.db);

    const proc = Bun.spawn(command, {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, ...env },
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      const errorMsg =
        stderr.trim() || `${toolName} exited with code ${exitCode}`;
      backupLogger.error(`Backup failed: ${errorMsg}`);
      await sendBackupNotification(config, {
        success: false,
        error: errorMsg,
      });
      return;
    }

    await Bun.write(outputPath, stdout);

    backupLogger.info(`Backup saved to ${outputPath}`);
    await sendBackupNotification(config, { success: true, filename });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    backupLogger.error(`Backup error: ${errorMessage}`);
    await sendBackupNotification(config, {
      success: false,
      error: errorMessage,
    });
  }
};
