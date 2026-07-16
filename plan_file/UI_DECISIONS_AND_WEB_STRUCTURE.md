# J Split UI Decisions and Web Structure

## 1. Reference Principle

We can study existing split-bill and payment apps to understand common user expectations, but we must not copy their visual design, branding, screen layouts, text, icons, or unique interaction details.

References are used only to validate logic patterns:

- how users understand amount owed
- how groups and participants are represented
- how bill status is shown
- how itemized splitting is explained
- how settlement status is tracked
- how public bill links reduce friction

The product direction for J Split is receipt-first, not ledger-first.

```txt
Scan receipt
Review items
Choose equal or itemized split
Assign or let participants claim items
Review totals
Choose rounding
Finalize split
Share link
Track settlement
```

## 2. Product Positioning

J Split is a clean finance-style bill splitting app with a friendly social layer.

The MVP does not process real payments. It calculates who owes what and tracks manual settlement outside the app.

Real payment support can be added later through provider payment links and webhook-confirmed payment statuses.

## 3. Visual Direction

The app uses a white/light interface with blue accents for mobile readability.

### Color Palette

```txt
Primary: #111184
Deep navy: #00072D
Secondary navy: #051650
Mid blue: #0A2472
Action blue: #1A43BF
Background: #F7F8FC
Surface: #FFFFFF
Success: green
Warning: amber
Danger: red
```

Use blue for navigation, primary actions, active selections, and important states. Do not make the whole app dark blue.

## 4. Brand Placeholder

Use `J` as the temporary logo/brand mark.

The placeholder should appear as a simple square or rounded-square monogram in the primary blue.

## 5. Navigation

Mobile-first bottom navigation:

```txt
Home
Bills
New
Activity
Profile
```

The `New` action should be visually stronger because receipt scanning is the main product action.

Desktop can keep the same information architecture, with wider panels and side-by-side content.

## 6. Dashboard

The dashboard is a hybrid home screen.

It must include:

- J logo
- strong New Bill / Scan Receipt action
- recent bills
- pending settlements
- draft bills
- quick status chips

The dashboard should feel practical, not like a marketing landing page.

## 7. Receipt Scan

The first action is camera-style.

Primary action:

```txt
Scan Receipt
```

Secondary actions:

```txt
Upload File
Enter Manually
```

### Image Slot

Reserve a large image area for the receipt preview.

Picture needed:

- a real uploaded receipt photo
- clear enough for item inspection
- not decorative
- no dark blur or abstract stock image

## 8. Split Type Selection

After receipt review, show two clear choice cards:

```txt
Equal Split
Same amount for everyone.

Itemized Split
Assign each receipt item.
```

This should be a deliberate decision screen, not a tiny hidden setting.

## 9. Equal Split Flow

Equal split behavior:

- payer adds participant names
- system divides bill total across participants
- participants cannot adjust the split
- payer reviews rounding before sharing
- share link shows each participant what they owe

## 10. Itemized Split Flow

Each receipt item appears as a row with:

- item name
- item price
- assigned participants
- overflow/kebab menu button

The 3-dot button is called an overflow menu or kebab menu.

Menu actions:

```txt
Split item
Edit item
Duplicate
Delete
```

When `Split item` is selected:

- mobile: open a bottom sheet
- desktop/tablet: use inline expansion or side panel

Split item options:

- split equally
- custom amount
- custom percentage
- assign to one or more participants

## 11. Participant Public Link Logic

There are three public-link modes:

### Equal Split

Participant only sees their amount owed and settlement status.

### Unassigned Itemized Split

Payer sends the link without assigning items first.

Participant enters their name and claims their items.

### Assigned Itemized Split

Payer assigns participant names before sharing.

Participant sees assigned items. Editing is allowed only if the payer enables it.

## 12. Public Link Security

MVP uses link-only access.

Reason:

- payer controls who receives the link
- passcodes do not help much if participants can forward both link and code
- optional passcode can be added later for private groups

Share tokens must still be random and unguessable.

## 13. Money Display

Always show simple totals first.

Detailed breakdowns should be expandable.

Example:

```txt
Ben owes RM 32.10

Items: RM 28.00
Tax: RM 1.80
Service: RM 2.80
Discount: -RM 0.50
```

## 14. Tax, Service, Discount, and Tip

Use proportional allocation based on each person's item subtotal.

```txt
participant_ratio = participant_item_subtotal / bill_item_subtotal
```

Then allocate:

- tax
- service charge
- tip
- discount

This is the default fairness model.

## 15. Rounding

Before sharing the payment link, payer chooses the rounding behavior.

Options:

```txt
Exact amount
Round each person down
Round each person up
Round to nearest 0.05
Round to nearest 0.10
Round to nearest 1.00
```

The app must show the difference clearly.

Example:

```txt
Exact total: RM 128.43
Rounded total collected: RM 128.50
Difference: +RM 0.07
```

If rounded down, the payer absorbs the difference.

If rounded up, the extra must be shown as a rounding adjustment.

## 16. Settlement Status

For manual settlement:

```txt
Unpaid
Pending
Paid
Waived
Disputed
```

Both participant and payer can interact with settlement state:

- participant can mark as paid
- payer confirms paid
- before confirmation, status is pending

For future real payments:

- payment provider webhook marks successful payments as paid
- browser redirect alone is not enough

## 17. Multiple Currency

Support currency per bill.

The app can have a default currency setting, but every bill should store its own currency.

## 18. Reserved Image Places

### Receipt Preview

Purpose: show uploaded/scanned receipt.

Picture needed: actual receipt image, high contrast and readable.

### Empty Scan State

Purpose: show before any receipt is uploaded.

Picture needed: simple original camera/receipt visual or product-created image. Do not copy another app's illustration.

### Participant Avatars

Purpose: show people in the bill.

Picture needed: initials by default. Later, user profile images.

### Payment Instruction QR

Purpose: optional external payment instruction.

Picture needed: payer-uploaded QR image for DuitNow, Touch n Go, bank transfer, or another external method.

### Receipt OCR Confidence Preview

Purpose: future OCR review screen.

Picture needed: receipt image with app-generated highlights over detected line items.

## 19. First Web Version Scope

The first structured web version should include:

- dashboard shell
- receipt scan section
- split type choice cards
- itemized receipt rows
- overflow menu example
- recent bills
- split summary
- image placeholder notes
- bottom mobile navigation

This is a UI foundation, not the full backend implementation.
