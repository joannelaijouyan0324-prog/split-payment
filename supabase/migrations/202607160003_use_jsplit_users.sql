CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS jsplit_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  email text UNIQUE,
  phone text,
  default_currency char(3) NOT NULL DEFAULT 'MYR',
  card_save_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_payment_methods
  DROP CONSTRAINT IF EXISTS user_payment_methods_user_id_fkey;

ALTER TABLE user_payment_methods
  ADD CONSTRAINT user_payment_methods_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES jsplit_users(id)
  ON DELETE CASCADE;

ALTER TABLE bills
  DROP CONSTRAINT IF EXISTS bills_owner_user_id_fkey;

ALTER TABLE bills
  ADD CONSTRAINT bills_owner_user_id_fkey
  FOREIGN KEY (owner_user_id)
  REFERENCES jsplit_users(id)
  ON DELETE SET NULL;

ALTER TABLE bill_participants
  DROP CONSTRAINT IF EXISTS bill_participants_user_id_fkey;

ALTER TABLE bill_participants
  ADD CONSTRAINT bill_participants_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES jsplit_users(id)
  ON DELETE SET NULL;

ALTER TABLE activity_logs
  DROP CONSTRAINT IF EXISTS activity_logs_actor_user_id_fkey;

ALTER TABLE activity_logs
  ADD CONSTRAINT activity_logs_actor_user_id_fkey
  FOREIGN KEY (actor_user_id)
  REFERENCES jsplit_users(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS jsplit_users_email_idx ON jsplit_users(email);

GRANT SELECT, INSERT, UPDATE, DELETE ON jsplit_users TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

