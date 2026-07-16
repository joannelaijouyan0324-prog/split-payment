# Supabase Setup

Project URL:

```txt
https://drzawixotavjlenxunzx.supabase.co
```

Project ref:

```txt
drzawixotavjlenxunzx
```

## Environment Variables

The frontend uses:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

The direct Postgres URL should only be used for server-side admin tools and migrations:

```txt
postgresql://postgres:[YOUR-PASSWORD]@db.drzawixotavjlenxunzx.supabase.co:5432/postgres
```

Do not put the database password in client-side code.

## Link Project

Install the Supabase CLI first if needed, then run:

```powershell
supabase login
supabase init
supabase link --project-ref drzawixotavjlenxunzx
```

## Apply Migration

The initial schema is here:

```txt
supabase/migrations/202607140001_initial_schema.sql
```

After linking the project, push the migration:

```powershell
supabase db push
```

## Tables Created

- `users`
- `bills`
- `bill_participants`
- `receipt_images`
- `bill_items`
- `item_assignments`
- `split_results`
- `settlements`
- `activity_logs`
