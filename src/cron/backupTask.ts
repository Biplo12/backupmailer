import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { EnvConfig } from "../utils/env.ts";
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

export const runBackup = async (config: EnvConfig): Promise<void> => {
  const backupDir = "/app/backups";
  ensureDirectory(backupDir);

  const filename = `backup_${buildTimestamp()}.sql`;
  const outputPath = join(backupDir, filename);

  const { host, port, user, password, database } = config.db;

  backupLogger.info(
    `Starting backup of database "${database}" on ${host}:${port}...`
  );

  try {
    const proc = Bun.spawn(
      [
        "mysqldump",
        "--skip-ssl",
        "-h",
        host,
        "-P",
        String(port),
        "-u",
        user,
        `-p${password}`,
        database,
      ],
      { stdout: "pipe", stderr: "pipe" }
    );

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      const errorMsg =
        stderr.trim() || `mysqldump exited with code ${exitCode}`;
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
