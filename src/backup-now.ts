import { loadEnvConfig } from "./utils/env.ts";
import { backupLogger } from "./utils/logger.ts";
import { runBackup } from "./cron/backupTask.ts";

const main = async () => {
  const config = loadEnvConfig();

  backupLogger.info("Manual backup triggered (backup-now)");
  await runBackup(config);
  backupLogger.info("Done");

  process.exit(0);
};

main();
