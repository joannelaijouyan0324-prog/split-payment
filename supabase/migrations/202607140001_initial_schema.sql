CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  email text UNIQUE,
  default_currency char(3) NOT NULL DEFAULT 'MYR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  merchant_name text,
  bill_date date NOT NULL DEFAULT CURRENT_DATE,
  currency char(3) NOT NULL DEFAULT 'MYR',
  paid_by_participant_id uuid,
  subtotal_minor integer NOT NULL DEFAULT 0,
  tax_minor integer NOT NULL DEFAULT 0,
  service_charge_minor integer NOT NULL DEFAULT 0,
  discount_minor integer NOT NULL DEFAULT 0,
  tip_minor integer NOT NULL DEFAULT 0,
  total_minor integer NOT NULL DEFAULT 0,
  split_mode text NOT NULL DEFAULT 'itemized',
  rounding_mode text NOT NULL DEFAULT 'exact',
  status text NOT NULL DEFAULT 'draft',
  share_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  participant_can_edit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bills_split_mode_check CHECK (split_mode IN ('equal', 'itemized')),
  CONSTRAINT bills_rounding_mode_check CHECK (rounding_mode IN ('exact', 'down', 'up')),
  CONSTRAINT bills_status_check CHECK (status IN ('draft', 'review', 'active', 'settled', 'archived'))
);

CREATE TABLE IF NOT EXISTS bill_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'participant',
  settlement_status text NOT NULL DEFAULT 'unpaid',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bill_participants_role_check CHECK (role IN ('payer', 'participant')),
  CONSTRAINT bill_participants_settlement_status_check CHECK (settlement_status IN ('unpaid', 'pending', 'paid', 'waived', 'disputed'))
);

ALTER TABLE bills
  ADD CONSTRAINT bills_paid_by_participant_id_fkey
  FOREIGN KEY (paid_by_participant_id)
  REFERENCES bill_participants(id)
  ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS receipt_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  content_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bill_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity numeric(10, 2) NOT NULL DEFAULT 1,
  unit_price_minor integer NOT NULL,
  total_price_minor integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS item_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES bill_items(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES bill_participants(id) ON DELETE CASCADE,
  share_ratio numeric(12, 6) NOT NULL DEFAULT 1,
  share_amount_minor integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, participant_id)
);

CREATE TABLE IF NOT EXISTS split_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES bill_participants(id) ON DELETE CASCADE,
  item_total_minor integer NOT NULL,
  tax_share_minor integer NOT NULL DEFAULT 0,
  service_charge_share_minor integer NOT NULL DEFAULT 0,
  discount_share_minor integer NOT NULL DEFAULT 0,
  tip_share_minor integer NOT NULL DEFAULT 0,
  rounding_adjustment_minor integer NOT NULL DEFAULT 0,
  final_owed_minor integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bill_id, participant_id)
);

CREATE TABLE IF NOT EXISTS settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  from_participant_id uuid NOT NULL REFERENCES bill_participants(id) ON DELETE CASCADE,
  to_participant_id uuid NOT NULL REFERENCES bill_participants(id) ON DELETE CASCADE,
  amount_minor integer NOT NULL,
  status text NOT NULL DEFAULT 'unpaid',
  external_method text,
  note text,
  settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settlements_status_check CHECK (status IN ('unpaid', 'pending', 'paid', 'waived', 'disputed'))
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid REFERENCES bills(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bills_owner_user_id_idx ON bills(owner_user_id);
CREATE INDEX IF NOT EXISTS bills_share_token_idx ON bills(share_token);
CREATE INDEX IF NOT EXISTS bill_participants_bill_id_idx ON bill_participants(bill_id);
CREATE INDEX IF NOT EXISTS bill_items_bill_id_idx ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS item_assignments_item_id_idx ON item_assignments(item_id);
CREATE INDEX IF NOT EXISTS split_results_bill_id_idx ON split_results(bill_id);
CREATE INDEX IF NOT EXISTS settlements_bill_id_idx ON settlements(bill_id);
