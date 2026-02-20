import cron from "node-cron";
import { loadEnvConfig } from "./utils/env.ts";
import { backupLogger } from "./utils/logger.ts";
import { runBackup } from "./cron/backupTask.ts";

const main = async () => {
  const config = loadEnvConfig();

  backupLogger.info("BackupMailer started");
  backupLogger.info(`Cron schedule: ${config.CRON_SCHEDULE}`);
  backupLogger.info(`Backup path:   ${config.BACKUP_PATH}`);
  backupLogger.info(
    `Database:      ${config.db.database}@${config.db.host}:${config.db.port}`
  );

  if (!cron.validate(config.CRON_SCHEDULE)) {
    backupLogger.error(`Invalid cron expression: "${config.CRON_SCHEDULE}"`);
    process.exit(1);
  }

  const task = cron.schedule(config.CRON_SCHEDULE, async () => {
    backupLogger.info("Cron triggered -- starting backup job");
    await runBackup(config);

    const nextRun = task.getNextRun();
    if (nextRun) {
      backupLogger.info(`Next scheduled run: ${nextRun.toISOString()}`);
    }
  });

  const nextRun = task.getNextRun();
  backupLogger.info(
    `Cron job registered. Next run: ${
      nextRun ? nextRun.toISOString() : "unknown"
    }`
  );
};

main();
