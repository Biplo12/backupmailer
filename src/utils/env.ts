export type DatabaseConnection = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export type EnvConfig = {
  NODE_ENV: string;
  BACKUP_PATH: string;
  CRON_SCHEDULE: string;
  DATABASE_URL: string;
  db: DatabaseConnection;
  MAIL_HOST: string;
  MAIL_PORT: number;
  MAIL_USER: string;
  MAIL_PASS: string;
  MAIL_TO: string;
};

const REQUIRED_VARS = [
  "NODE_ENV",
  "BACKUP_PATH",
  "CRON_SCHEDULE",
  "DATABASE_URL",
  "MAIL_HOST",
  "MAIL_PORT",
  "MAIL_USER",
  "MAIL_PASS",
  "MAIL_TO",
] as const;

const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const parseDatabaseUrl = (raw: string): DatabaseConnection => {
  try {
    const url = new URL(raw);
    const database = url.pathname.replace(/^\//, "");

    if (!url.hostname || !url.username || !database) {
      throw new Error("URL must contain host, username, and database name");
    }

    return {
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database,
    };
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(`Invalid DATABASE_URL: "${raw}" is not a valid URL`);
    }
    throw err;
  }
};

export const loadEnvConfig = (): EnvConfig => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}`
    );
  }

  const databaseUrl = getEnvVar("DATABASE_URL");

  return {
    NODE_ENV: getEnvVar("NODE_ENV"),
    BACKUP_PATH: getEnvVar("BACKUP_PATH"),
    CRON_SCHEDULE: getEnvVar("CRON_SCHEDULE"),
    DATABASE_URL: databaseUrl,
    db: parseDatabaseUrl(databaseUrl),
    MAIL_HOST: getEnvVar("MAIL_HOST"),
    MAIL_PORT: parseInt(getEnvVar("MAIL_PORT"), 10),
    MAIL_USER: getEnvVar("MAIL_USER"),
    MAIL_PASS: getEnvVar("MAIL_PASS"),
    MAIL_TO: getEnvVar("MAIL_TO"),
  };
};
