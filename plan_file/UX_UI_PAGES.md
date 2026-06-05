# UX/UI Page Design Plan

## 1. Design Goal

The app should feel fast, clear, and practical. Users are usually splitting a bill after a meal or during a group activity, so the interface should reduce friction and avoid making people think too much.

The most important UX goal is:

```txt
Take receipt photo -> review items -> invite people -> people select items -> see who owes what -> track paid status
```

The app does not process payments. It only helps users calculate and track bill settlement outside the app.

## 2. Main Navigation Structure

Recommended primary navigation:

```txt
Dashboard
Groups
Bills
Activity
Profile
```

For mobile, use a bottom tab bar:

```txt
Home | Groups | New Bill | Activity | Profile
```

The "New Bill" action should be visually prominent because it is the core action.

## 3. Page List Summary

### Authentication

- Welcome / Landing
- Login
- Sign Up
- Forgot Password

### Main App

- Dashboard
- Receipt Capture
- Receipt Review
- Manual Item Entry
- Bill Participants
- Participant Item Selection
- Bill Review
- Split Summary
- Shared Bill Public View
- Settlement Tracking
- Bill Detail
- Bill History

### Groups

- Groups List
- Create Group
- Group Detail
- Group Members
- Group Bill History

### User

- Profile
- External Payment Info
- Notification Settings

### Support / Utility

- Activity Feed
- Empty States
- Error States
- Loading States
- Not Found

## 4. Authentication Pages

## 4.1 Welcome / Landing Page

### Purpose

Introduce the app and let users start quickly.

### Main Components

- App name/logo
- Short value statement
- Primary button: "Create a bill"
- Secondary button: "Log in"
- Example mini bill preview

### Design Notes

Keep this simple. Do not make it a marketing-heavy landing page. The product should be the first thing users understand.

## 4.2 Login Page

### Purpose

Let existing users access their bills.

### Main Components

- Email input
- Password input
- Login button
- Forgot password link
- Sign up link
- Optional social login buttons

### States

- Empty
- Invalid credentials
- Loading
- Success redirect

## 4.3 Sign Up Page

### Purpose

Create a new user account.

### Main Components

- Name input
- Email input
- Password input
- Confirm password input
- Create account button
- Login link

### States

- Empty
- Validation errors
- Email already used
- Loading
- Success redirect

## 5. Dashboard

### Purpose

Give users a quick overview of recent bills, unpaid settlements, and the main action to create a bill.

### Main Components

- Greeting
- Create bill button
- Recent bills list
- Pending settlement cards
- Groups preview
- Empty state for new users

### Useful Data

- Bill title
- Group/event name
- Date
- Total amount
- Number of participants
- Paid/unpaid status

### Primary Actions

- Create new bill
- Open recent bill
- Mark settlement paid
- Open group

### Design Notes

This should feel like an operational dashboard, not a decorative homepage. Prioritize clarity and scan speed.

## 6. Create Bill Flow

The create bill flow should be receipt-first. The user should not have to start from a blank accounting form unless they choose manual entry.

Recommended steps:

```txt
1. Capture receipt
2. Review items
3. Invite participants
4. Participants select items
5. Review
6. Share/Track
```

Use a progress indicator, but keep the user free to go back and edit.

## 6.1 Receipt Capture Page

### Purpose

Start the bill by taking a photo or uploading a receipt.

### Main Components

- Camera capture button
- Upload receipt button
- Receipt preview
- Manual entry fallback
- Optional OCR progress

### Primary Actions

- Take photo
- Upload image
- Continue manually

## 6.2 Receipt Review / Bill Info Page

### Purpose

Review extracted receipt details and set any missing bill information.

### Main Components

- Bill title
- Merchant/place name
- Date
- Currency
- Paid by
- Optional group selector
- Extracted item list preview
- Receipt total mismatch warning

### Primary Actions

- Continue
- Save draft

## 6.3 Receipt Upload Page

### Purpose

Let users upload or capture a receipt image.

### Main Components

- Camera/upload area
- Receipt preview
- Replace image button
- Continue with manual entry button
- Optional OCR status

### States

- No image selected
- Uploading
- Uploaded
- Upload failed
- OCR processing
- OCR completed
- OCR failed

### Design Notes

Manual entry must always be available. OCR should feel helpful, not required.

## 6.4 Manual Item Entry Page

### Purpose

Let users enter receipt line items and bill-level totals.

### Main Components

- Item list
- Add item button
- Item name input
- Quantity input
- Price input
- Subtotal
- Tax
- Service charge
- Tip
- Discount
- Total
- Receipt total mismatch warning

### Primary Actions

- Add item
- Delete item
- Duplicate item
- Continue to participants or item selection

### Design Notes

This page needs excellent mobile ergonomics. Users may enter many items, so avoid cramped layouts and make adding items quick.

## 6.5 Participants / Invite Page

### Purpose

Add or invite the people included in the bill.

### Main Components

- Participant list
- Add participant input
- Optional contact/user search
- Share link
- QR invite
- Paid by selector
- Remove participant action

### Participant Types

- Registered user
- Guest participant by name

### Design Notes

Guest participants are important. Users should not be forced to invite everyone before splitting a bill.

## 6.6 Participant Item Selection Page

### Purpose

Let each participant select the items they bought or shared.

### Main Components

- Receipt item list
- Participant chips or avatars
- Item claim controls
- Shared item control
- Split equally toggle
- Custom share control
- Unclaimed item warning
- Duplicate claim warning
- Claim confirmation

### Interaction Ideas

- Participant opens the shared bill link and taps their own items
- Participant can mark an item as shared with others
- Host can review and adjust claims if needed
- Use participant chips under each item to show who claimed it
- Show selected participants visually

### States

- Item unclaimed
- Item claimed by one person
- Item shared equally
- Item shared with custom ratios
- Item claimed by multiple people unexpectedly

### Design Notes

This is the most important UX screen. It should be fast, obvious, and forgiving. The user should feel like they are claiming what they bought, not doing accounting work for the whole group.

## 6.7 Bill Review Page

### Purpose

Let the user verify the final bill before sharing.

### Main Components

- Receipt total
- Calculated total
- Per-person breakdown
- Tax/service/discount allocation summary
- Unclaimed item warning
- Duplicate claim warning
- Total mismatch warning
- Edit buttons for each section

### Primary Actions

- Confirm split
- Go back to edit
- Save draft

### Design Notes

This page should build trust. Users need to understand why each person owes their amount.

## 6.8 Split Summary Page

### Purpose

Show the final result after bill confirmation.

### Main Components

- Bill title
- Paid by
- Total amount
- Each participant amount owed
- Settlement status
- Share button
- Copy summary button
- Mark paid button

### Example Display

```txt
Alex paid RM 128.40

Jamie owes Alex RM 32.10
Sam owes Alex RM 41.80
Taylor owes Alex RM 26.20
```

### Design Notes

This should be clean and shareable. Avoid hiding the numbers behind too much UI.

## 7. Shared Bill Public View

### Purpose

Allow participants to view the split through a link without needing to log in.

### Main Components

- Bill title
- Merchant
- Date
- Paid by
- Participant list
- Amounts owed
- Item breakdown
- External payment instruction text

### Restrictions

- No editing unless authenticated and authorized
- No private profile data
- Receipt image visibility should be optional

### Design Notes

This page must be simple because recipients may only open it once to check what they owe.

## 8. Settlement Tracking Page

### Purpose

Help the payer track who has paid outside the app.

### Main Components

- Participant settlement list
- Amount owed
- Status selector
- External method label
- Note field
- Settled date

### Settlement States

```txt
Unpaid
Pending
Paid
Waived
Disputed
```

### Design Notes

Make "Mark as paid" very easy for the payer. Since the app does not verify payment, the UI should say "Marked as paid", not "Payment confirmed".

## 9. Bill Detail Page

### Purpose

Show the full bill record after creation.

### Main Components

- Bill summary
- Receipt image
- Item list
- Participant item selections
- Split results
- Settlement tracking
- Activity log

### Primary Actions

- Edit bill
- Share bill
- Mark settlements
- Delete bill

## 10. Bill History Page

### Purpose

Show all previous bills.

### Main Components

- Search
- Filters
- Bill list
- Date grouping
- Status filter
- Group filter

### Filters

```txt
All
Draft
Active
Settled
Unpaid
```

## 11. Groups

## 11.1 Groups List Page

### Purpose

Show all groups the user belongs to.

### Main Components

- Group cards/list rows
- Group name
- Member count
- Recent bill count
- Balance/status summary
- Create group button

## 11.2 Create Group Page

### Purpose

Create a persistent group for repeated bills.

### Main Components

- Group name
- Default currency
- Add members
- Create button

## 11.3 Group Detail Page

### Purpose

Show group overview and recent activity.

### Main Components

- Group name
- Members preview
- Create bill in group button
- Recent bills
- Outstanding settlements
- Group activity

## 11.4 Group Members Page

### Purpose

Manage group participants.

### Main Components

- Member list
- Add member
- Remove member
- Role indicator

## 11.5 Group Bill History Page

### Purpose

Show all bills connected to a group.

### Main Components

- Bill list
- Search
- Filters
- Sort by date/status/amount

## 12. Activity Feed

### Purpose

Show recent changes across bills and groups.

### Main Components

- Bill created
- Bill edited
- Split confirmed
- Summary shared
- Settlement marked paid
- Settlement marked disputed

### Design Notes

Keep this lightweight. It is useful for trust and accountability.

## 13. Profile Pages

## 13.1 Profile Page

### Purpose

Manage user identity and preferences.

### Main Components

- Name
- Email
- Phone
- Avatar
- Default currency
- Save button

## 13.2 External Payment Info Page

### Purpose

Let users save text instructions for external repayment.

### Main Components

- Preferred payment method label
- Payment instruction text
- Optional QR image upload

### Example

```txt
Preferred method: DuitNow
Instruction: Pay to 012-3456789 under Alex Tan
```

### Important Note

This is not a payment integration. It is only informational.

## 13.3 Notification Settings Page

### Purpose

Let users control reminders.

### Main Components

- Email notifications toggle
- Push notifications toggle
- Reminder frequency
- Group activity toggle

## 14. Empty States

Design these states:

- No bills yet
- No groups yet
- No participants yet
- No receipt uploaded
- No items added
- No activity yet
- No unpaid settlements

Each empty state should have one clear next action.

## 15. Error States

Design these states:

- Upload failed
- Receipt total mismatch
- Missing participants
- Unclaimed items
- Duplicate item claims
- Calculation error
- Share link expired
- Permission denied
- Network error

## 16. Loading States

Design these states:

- Page loading
- Bill saving
- Split calculating
- Receipt uploading
- OCR processing
- Share link generating

Use skeleton loading for lists and clear progress indicators for receipt upload/OCR.

## 17. Core Components To Design

### Layout Components

- App shell
- Bottom navigation
- Top bar
- Page header
- Step progress indicator
- Empty state block
- Modal/dialog
- Drawer/bottom sheet

### Bill Components

- Bill card
- Receipt image preview
- Item row
- Participant chip
- Item claim selector
- Money input
- Total mismatch warning
- Split result row
- Settlement status badge

### Form Components

- Text input
- Currency input
- Number input
- Date picker
- Select/menu
- Toggle
- Segmented control
- Button
- Icon button

## 18. Suggested Figma Frames

Design these first:

```txt
1. Dashboard
2. Receipt Capture
3. Receipt Review / Manual Items
4. Invite Participants
5. Participant Item Selection
6. Bill Review
7. Split Summary
8. Shared Public Bill View
9. Settlement Tracking
10. Bill Detail
11. Groups List
12. Group Detail
13. Profile
14. Empty States
15. Error States
```

If you only design five screens first, design these:

```txt
1. Dashboard
2. Manual Item Entry
3. Invite Participants
4. Participant Item Selection
5. Split Summary
```

## 19. Design Priorities

### Highest Priority

- Manual item entry
- Participant item selection
- Split summary
- Settlement tracking

### Medium Priority

- Dashboard
- Groups
- Bill history
- Shared public view

### Lower Priority

- Activity feed
- Notification settings
- OCR-specific states
- Admin tools

## 20. Recommended MVP Page Set

For the first version, design and build only these:

```txt
Login
Sign Up
Dashboard
Receipt Capture
Receipt Review
Invite Participants
Manual Item Entry
Participant Item Selection
Bill Review
Split Summary
Bill Detail
Settlement Tracking
Shared Public View
Profile
```

This is enough to build a complete bill-splitting experience without payments.
