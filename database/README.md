# Database

Local development can optionally use PostgreSQL through Docker Compose, but the main project database is now Supabase.

Use the local database only when you want an offline development database.

## Connection

```txt
postgresql://jsplit:jsplit_dev_password@localhost:5432/jsplit
```

Inside Docker, the web app uses:

```txt
postgresql://jsplit:jsplit_dev_password@postgres:5432/jsplit
```

## Start

```powershell
docker compose --profile local-db up -d postgres
```

Or start everything:

```powershell
docker compose --profile local-db up --build
```

## Tables

The initial schema creates:

- `users`
- `bills`
- `bill_participants`
- `receipt_images`
- `bill_items`
- `item_assignments`
- `split_results`
- `settlements`
- `activity_logs`

Money is stored as integer minor units, such as cents or sen.

## Reset Local Data

This deletes the local database volume and recreates the schema on next start:

```powershell
docker compose down -v
docker compose up --build
```
