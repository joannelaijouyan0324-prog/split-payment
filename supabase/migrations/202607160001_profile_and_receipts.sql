ALTER TABLE jsplit_users
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS card_save_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS user_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_customer_id text,
  provider_payment_method_id text,
  purpose text NOT NULL DEFAULT 'pay',
  brand text,
  last4 text,
  exp_month integer,
  exp_year integer,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_payment_methods_purpose_check CHECK (purpose IN ('pay', 'receive', 'both'))
);

CREATE INDEX IF NOT EXISTS user_payment_methods_user_id_idx ON user_payment_methods(user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Receipts can be uploaded during MVP" ON storage.objects;

CREATE POLICY "Receipts can be uploaded during MVP"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Receipts can be read during MVP" ON storage.objects;

CREATE POLICY "Receipts can be read during MVP"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'receipts');
