# Split Payment Project Plan

## 1. Project Summary

This project is a bill-splitting app for groups of people who share expenses. The app helps one person take or upload a receipt, invite participants to select the items they bought, calculate each person's share, and track who has settled outside the app.

The app does not process payments. It does not store bank details, cards, wallets, or move money between users. Users can pay each other using any external method they prefer, such as cash, bank transfer, DuitNow, Venmo, PayPal, Touch 'n Go, GrabPay, Zelle, or other services.

The core product value is accurate splitting, simple receipt handling, transparent calculations, and easy tracking.

## 2. Product Scope

### In Scope

- User accounts
- Groups or events
- Receipt upload
- Manual receipt entry
- Optional receipt OCR integration
- Receipt review and correction
- Itemized splitting
- Equal splitting
- Shared item splitting
- Tax, service charge, discount, and tip allocation
- Calculation of who owes whom
- External payment instructions
- Manual settlement tracking
- Reminders and notifications
- Activity history
- Basic admin and audit tools

### Out of Scope

- In-app card payments
- Wallet balances
- Escrow
- Payouts
- Bank account linking
- KYC or identity verification
- Holding user funds
- Automated money transfer
- Financial institution features

Keeping payments out of scope makes the app much easier, faster, safer, and cheaper to build.

## 3. Target Users

### Primary Users

- Friends eating together
- Roommates sharing bills
- Travel groups
- Small teams
- Couples or families managing shared expenses

### Main User Needs

- "I paid first. I need to know how much each person owes me."
- "Some people shared items, some ordered separate items."
- "Tax and service charge should be split fairly."
- "I want to track who has paid me back."
- "I do not want to calculate this manually."

## 4. Core User Flow

1. User signs in.
2. User takes a receipt photo or uploads a receipt image.
3. App extracts receipt items with OCR, or the user enters items manually.
4. User reviews and edits item names, prices, tax, service charge, discount, and total.
5. User adds or invites participants through names, link, QR, or group members.
6. Participants open the bill and select the items they bought or shared.
7. Payer reviews participant selections and resolves conflicts or unclaimed items.
8. App calculates each person's share.
9. App shows a summary of who owes the payer.
10. User shares the result with the group.
11. Participants pay outside the app.
12. User marks each participant as settled.

## 5. Recommended MVP

The MVP should focus on bill splitting without payment integration.

### MVP Features

- Sign up and login
- Create a bill from a receipt photo or manual entry
- Add participants by name
- Enter receipt items manually
- Upload a receipt image for record keeping
- Let participants select the items they bought
- Split items among multiple people
- Add tax, service charge, discount, and tip
- Calculate total owed per participant
- Generate a shareable bill summary link
- Mark participants as paid/unpaid
- Basic bill history

### MVP Non-Goals

- OCR is optional in the first version
- No external payment provider
- No bank transfer integration
- No native mobile app required
- No complex group accounting yet

## 6. Version Roadmap

### Version 1: Manual Bill Splitting

- User authentication
- Bill creation
- Participant management
- Manual item entry
- Participant item selection
- Equal split and itemized split
- Tax/service/discount/tip allocation
- Settlement status
- Shareable bill summary

### Version 2: Receipt Upload and OCR

- Receipt image upload
- OCR job queue
- Parsed merchant, date, totals, and line items
- Receipt review screen
- OCR confidence display
- Manual correction flow

### Version 3: Groups and Recurring Expenses

- Persistent groups
- Group balances
- Multi-bill history
- Netting balances across multiple bills
- Group activity feed
- Notifications and reminders

### Version 4: Polish and Scale

- PWA offline drafts
- Better mobile camera UX
- Export to PDF or CSV
- Analytics
- Admin dashboard
- More robust audit logs

## 7. Architecture Overview

```txt
Frontend App
  |
  | HTTPS
  v
Backend API
  |
  |-- Auth Module
  |-- Users Module
  |-- Groups Module
  |-- Bills Module
  |-- Receipts Module
  |-- Split Calculation Module
  |-- Settlement Module
  |-- Notification Module
  |
  v
PostgreSQL Database
  |
  v
Object Storage
  |
  v
Optional External Services
  |-- OCR Provider
  |-- Email Provider
  |-- Push Notification Provider
```

## 8. Frontend Architecture

### Recommended Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand or React Context for local bill editing state
- PWA support

### Main Screens

- Login
- Dashboard
- Groups
- Group detail
- Create bill
- Receipt upload
- Manual receipt editor
- Participant item selection
- Split summary
- Settlement tracking
- Bill history
- Profile

### Important UX Details

- Mobile-first design
- Fast item entry
- Easy participant selection
- Clear per-person totals
- Clear explanation of tax/service/discount allocation
- Support for shared items
- Support for one payer or multiple payers later
- Prevent totals from silently mismatching the receipt

## 9. Backend Architecture

### Recommended Stack

- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- Redis and BullMQ for background jobs

### Backend Modules

```txt
AuthModule
UsersModule
GroupsModule
BillsModule
ParticipantsModule
ReceiptsModule
SplitCalculatorModule
SettlementsModule
NotificationsModule
FilesModule
AuditLogModule
```

### API Design

Use REST for the MVP.

Example endpoints:

```txt
POST   /auth/register
POST   /auth/login
GET    /me

POST   /groups
GET    /groups
GET    /groups/:id
POST   /groups/:id/members

POST   /bills
GET    /bills/:id
PATCH  /bills/:id
DELETE /bills/:id

POST   /bills/:id/participants
PATCH  /bills/:id/participants/:participantId

POST   /bills/:id/items
PATCH  /bills/:id/items/:itemId
DELETE /bills/:id/items/:itemId

PUT    /bills/:id/assignments
POST   /bills/:id/calculate
GET    /bills/:id/summary

PATCH  /bills/:id/settlements/:participantId

POST   /files/receipt-upload-url
POST   /receipts/:id/ocr
```

## 10. Database Design

Use PostgreSQL. Store money values as integer minor units, such as cents or sen. Do not use floating point numbers for money.

### Main Tables

```txt
users
groups
group_members
bills
bill_participants
receipt_images
bill_items
item_assignments
bill_adjustments
split_results
settlements
notifications
audit_logs
```

### Example Schema

```sql
users (
  id uuid primary key,
  name text not null,
  email text unique,
  phone text,
  avatar_url text,
  default_currency text not null default 'MYR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

groups (
  id uuid primary key,
  name text not null,
  created_by_user_id uuid not null references users(id),
  default_currency text not null default 'MYR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

group_members (
  id uuid primary key,
  group_id uuid not null references groups(id),
  user_id uuid references users(id),
  display_name text not null,
  role text not null default 'member',
  created_at timestamptz not null default now()
);

bills (
  id uuid primary key,
  group_id uuid references groups(id),
  created_by_user_id uuid not null references users(id),
  paid_by_participant_id uuid,
  title text not null,
  merchant_name text,
  bill_date date,
  currency text not null default 'MYR',
  subtotal_minor integer not null default 0,
  tax_minor integer not null default 0,
  service_charge_minor integer not null default 0,
  tip_minor integer not null default 0,
  discount_minor integer not null default 0,
  total_minor integer not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

bill_participants (
  id uuid primary key,
  bill_id uuid not null references bills(id),
  user_id uuid references users(id),
  display_name text not null,
  created_at timestamptz not null default now()
);

bill_items (
  id uuid primary key,
  bill_id uuid not null references bills(id),
  name text not null,
  quantity numeric(10,2) not null default 1,
  unit_price_minor integer not null,
  total_price_minor integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

item_assignments (
  id uuid primary key,
  item_id uuid not null references bill_items(id),
  participant_id uuid not null references bill_participants(id),
  share_ratio numeric(10,4) not null,
  share_amount_minor integer,
  created_at timestamptz not null default now()
);

split_results (
  id uuid primary key,
  bill_id uuid not null references bills(id),
  participant_id uuid not null references bill_participants(id),
  item_total_minor integer not null,
  tax_share_minor integer not null,
  service_charge_share_minor integer not null,
  tip_share_minor integer not null,
  discount_share_minor integer not null,
  final_owed_minor integer not null,
  created_at timestamptz not null default now()
);

settlements (
  id uuid primary key,
  bill_id uuid not null references bills(id),
  from_participant_id uuid not null references bill_participants(id),
  to_participant_id uuid not null references bill_participants(id),
  amount_minor integer not null,
  status text not null default 'unpaid',
  external_method text,
  note text,
  marked_by_user_id uuid references users(id),
  settled_at timestamptz,
  created_at timestamptz not null default now()
);
```

## 11. Split Calculation Rules

### Equal Split

Each participant owes:

```txt
total / number_of_participants
```

Rounding must happen in minor units. Any remainder should be assigned using a deterministic rule, such as to the payer or to participants ordered by ID.

### Itemized Split

Each participant selects or is linked to one or more item shares.

```txt
participant_item_total = sum(selected item shares)
participant_ratio = participant_item_total / subtotal
```

Then allocate bill-level adjustments proportionally:

```txt
participant_tax = tax * participant_ratio
participant_service_charge = service_charge * participant_ratio
participant_tip = tip * participant_ratio
participant_discount = discount * participant_ratio

participant_final_owed =
  participant_item_total
  + participant_tax
  + participant_service_charge
  + participant_tip
  - participant_discount
```

### Shared Items

If an item is shared equally between two people:

```txt
person_share = item_total / 2
```

If shared unequally:

```txt
person_share = item_total * share_ratio
```

### Rounding Policy

- Always calculate in integer minor units.
- Never use JavaScript floating point values for final money calculations.
- Store the rounding difference.
- Apply rounding remainder deterministically.
- Show users if the calculated total does not match the receipt total.

## 12. Receipt Handling

### MVP Receipt Strategy

For the first version:

- Let users upload receipt images.
- Let users manually enter line items.
- Store the uploaded image for reference.
- Do not require OCR.

### Future OCR Strategy

OCR should run asynchronously.

```txt
User uploads receipt
  -> backend stores image
  -> backend creates OCR job
  -> worker calls OCR provider
  -> parsed data is saved
  -> user reviews and edits data
```

Possible OCR providers:

- Veryfi
- Google Document AI
- AWS Textract

OCR should be treated as a helper, not a source of truth. The user must always be able to edit the receipt.

## 13. Settlement Tracking Without Payments

Because the app does not process payments, settlement is only a status-tracking feature.

Settlement states:

```txt
unpaid
pending
paid
waived
disputed
```

Possible external payment method labels:

```txt
cash
bank_transfer
duitnow
venmo
paypal
zelle
touch_n_go
grabpay
other
```

The app can show instructions like:

```txt
Please pay Alex RM 24.80 using your preferred method.
```

It should not initiate or confirm the payment automatically in the MVP.

## 14. Security Requirements

- Require authentication for private bills.
- Support public share links only if explicitly enabled.
- Use random, unguessable share tokens.
- Protect uploaded receipt images with private URLs.
- Use signed URLs for upload and download.
- Validate all input on the backend.
- Enforce authorization on every bill, group, and file endpoint.
- Rate-limit auth and share-link endpoints.
- Keep audit logs for bill edits and settlement changes.

## 15. Permissions Model

### Bill Owner

- Edit bill
- Delete bill
- Add participants
- Review participant item selections
- Recalculate split
- Mark settlements
- Share bill

### Participant

- View bill
- View own amount
- Optionally mark own settlement as paid
- Comment or dispute amount in future versions

### Group Admin

- Manage group members
- View group history
- Edit group settings

## 16. Testing Plan

### Unit Tests

Focus heavily on the split calculator.

Test cases:

- Equal split with exact division
- Equal split with rounding remainder
- Itemized split
- Shared item split
- Tax allocation
- Service charge allocation
- Discount allocation
- Tip allocation
- Zero tax
- Negative discount
- One participant
- Many participants
- Total mismatch handling

### Integration Tests

- Create bill
- Add participants
- Add items
- Select or claim items
- Calculate split
- Mark settlement as paid
- Fetch summary

### End-to-End Tests

- User creates a bill from scratch
- Participants select their items
- User shares bill
- Participant views bill summary
- Owner marks participant as paid

## 17. Deployment Plan

### Simple Production Setup

```txt
Frontend: Vercel or Cloudflare Pages
Backend: Render, Fly.io, Railway, or AWS ECS
Database: Supabase Postgres, Neon, or AWS RDS
Storage: Cloudflare R2, Supabase Storage, or AWS S3
Queue: Redis with BullMQ
Monitoring: Sentry
Analytics: PostHog
```

### Environments

```txt
local
staging
production
```

Each environment should have separate:

- Database
- Storage bucket
- Auth secrets
- API keys
- OCR keys if used

## 18. Implementation Milestones

### Milestone 1: Project Foundation

- Set up frontend app
- Set up backend API
- Set up database
- Set up Prisma
- Add auth
- Add basic dashboard

### Milestone 2: Bill Creation

- Create bill
- Add participants
- Add manual receipt items
- Edit bill totals
- Save bill drafts

### Milestone 3: Split Engine

- Implement equal split
- Implement itemized split
- Implement shared item split
- Implement tax/service/discount/tip allocation
- Add unit tests

### Milestone 4: Bill Summary

- Display per-person amounts
- Display payer and owed amounts
- Generate shareable summary
- Add settlement status

### Milestone 5: Receipt Images

- Add file upload
- Store receipt image
- Show receipt preview
- Protect receipt access

### Milestone 6: Groups and History

- Create groups
- Add group members
- Attach bills to groups
- Show group bill history

### Milestone 7: Notifications

- Email summary
- Reminder notifications
- Settlement status updates

### Milestone 8: OCR Enhancement

- Add OCR provider
- Add OCR background worker
- Add receipt review UI
- Add OCR correction flow

## 19. Suggested First Build Order

1. Build bill data model.
2. Build split calculator as a pure function.
3. Add tests for calculator.
4. Build manual bill editor UI.
5. Connect frontend to backend.
6. Add settlement tracking.
7. Add shareable summary.
8. Add receipt image upload.
9. Add groups.
10. Add OCR later.

The split calculator should be built early because it is the heart of the product.

## 20. Key Product Principle

This app should not try to be a payment app first. It should be a clear, accurate, low-friction bill-splitting app.

The best user experience is:

```txt
Upload or enter receipt.
Participants select their items.
See exact amounts.
Share the result.
Track who paid outside the app.
```

That keeps the first version realistic and avoids unnecessary financial compliance work.
