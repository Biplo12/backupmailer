# BackupMailer

Automated MySQL database backup with email notifications, powered by **Bun** and **TypeScript**.

## Features

- Scheduled MySQL backups via `mysqldump` (cron-based)
- Email notifications on success and failure (SMTP via `nodemailer`)
- File-based logging (`logs/backup.log`, `logs/mail.log`)
- Fully configurable through `.env`
- Docker Compose setup (app + MySQL)

## Project Structure

```
backupmailer/
  src/
    index.ts              Entry point -- starts cron scheduler
    cron/
      backupTask.ts       Runs mysqldump subprocess
    mail/
      mailer.ts           Sends email notifications
    utils/
      env.ts              Typed env config with validation
      logger.ts           File + console logger
  backups/                Database dump output (gitignored)
  logs/                   Application logs (gitignored)
  Dockerfile
  docker-compose.yml
  .env.example
```

## Quick Start (Local)

### Prerequisites

- [Bun](https://bun.sh/) installed
- `mysqldump` available on PATH (comes with MySQL client)
- Access to a MySQL database
- SMTP credentials for email notifications

### Setup

```bash
# Install dependencies
bun install

# Copy and edit environment config
cp .env.example .env
# Edit .env with your database and SMTP settings

# Run
bun run start
```

## Quick Start (Docker Compose)

```bash
# Copy and edit environment config
cp .env.example .env
# Edit .env with your DATABASE_URL and SMTP settings

# Start containers
docker compose up -d

# View logs
docker compose logs -f app
```

This starts two containers:

- **app** -- BackupMailer (Bun + TypeScript)
- **db** -- MySQL 8 with a persistent volume

Backup files and logs are mounted to `./backups/` and `./logs/` on the host.

## Environment Variables

| Variable        | Description                         | Example                          |
| --------------- | ----------------------------------- | -------------------------------- |
| `BACKUP_PATH`   | Directory for backup files          | `./backups`                      |
| `CRON_SCHEDULE` | Cron expression for backup schedule | `0 2 * * *`                      |
| `DATABASE_URL`  | MySQL connection string             | `mysql://root:pass@db:3306/mydb` |
| `MAIL_HOST`     | SMTP server hostname                | `smtp.example.com`               |
| `MAIL_PORT`     | SMTP port                           | `587`                            |
| `MAIL_USER`     | SMTP username / sender email        | `you@example.com`                |
| `MAIL_PASS`     | SMTP password                       | `yourpassword`                   |
| `MAIL_TO`       | Notification recipient email        | `admin@example.com`              |

## How It Works

1. On startup, BackupMailer validates all environment variables and registers a cron job.
2. At each scheduled time, `mysqldump` runs as a subprocess and pipes output to a timestamped `.sql` file.
3. After the backup completes (or fails), an email notification is sent via SMTP.
4. All activity is logged to both the console and log files.

## License

MIT
