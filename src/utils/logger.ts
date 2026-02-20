import { mkdirSync, existsSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";

type LogLevel = "INFO" | "ERROR" | "WARN";

const ensureDirectoryExists = (filePath: string): void => {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

const formatMessage = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}\n`;
};

const writeToFile = (filePath: string, message: string): void => {
  ensureDirectoryExists(filePath);
  appendFileSync(filePath, message, "utf-8");
};

const LOGS_DIR = join(process.cwd(), "logs");

const createLogger = (logFile: string) => {
  const filePath = join(LOGS_DIR, logFile);

  return {
    info: (message: string): void => {
      const formatted = formatMessage("INFO", message);
      process.stdout.write(formatted);
      writeToFile(filePath, formatted);
    },
    error: (message: string): void => {
      const formatted = formatMessage("ERROR", message);
      process.stderr.write(formatted);
      writeToFile(filePath, formatted);
    },
    warn: (message: string): void => {
      const formatted = formatMessage("WARN", message);
      process.stdout.write(formatted);
      writeToFile(filePath, formatted);
    },
  };
};

export const backupLogger = createLogger("backup.log");
export const mailLogger = createLogger("mail.log");
