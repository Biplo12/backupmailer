import nodemailer from "nodemailer";
import type { EnvConfig } from "../utils/env.ts";
import { mailLogger } from "../utils/logger.ts";

type BackupResult = {
  success: boolean;
  filename?: string;
  error?: string;
};

const createTransporter = (config: EnvConfig) =>
  nodemailer.createTransport({
    host: config.MAIL_HOST,
    port: config.MAIL_PORT,
    secure: config.MAIL_PORT === 465,
    auth: {
      user: config.MAIL_USER,
      pass: config.MAIL_PASS,
    },
  });

const buildSubject = (result: BackupResult): string => {
  if (result.success) {
    return `[BackupMailer] Backup successful: ${result.filename}`;
  }
  return `[BackupMailer] Backup FAILED`;
};

const buildBody = (result: BackupResult): string => {
  const timestamp = new Date().toISOString();

  if (result.success) {
    return [
      "BackupMailer -- Backup Report",
      "─".repeat(40),
      `Status:    SUCCESS`,
      `File:      ${result.filename}`,
      `Timestamp: ${timestamp}`,
      "",
      "The database backup completed successfully.",
    ].join("\n");
  }

  return [
    "BackupMailer -- Backup Report",
    "─".repeat(40),
    `Status:    FAILED`,
    `Error:     ${result.error ?? "Unknown error"}`,
    `Timestamp: ${timestamp}`,
    "",
    "The database backup failed. Please check the server logs.",
  ].join("\n");
};

export const sendBackupNotification = async (
  config: EnvConfig,
  result: BackupResult
): Promise<void> => {
  const transporter = createTransporter(config);

  const mailOptions = {
    from: config.MAIL_USER,
    to: config.MAIL_TO,
    subject: buildSubject(result),
    text: buildBody(result),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    mailLogger.info(
      `Email sent successfully to ${config.MAIL_TO} (messageId: ${info.messageId})`
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    mailLogger.error(`Failed to send email: ${errorMessage}`);
  }
};
