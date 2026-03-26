# Contact Groups & Bulk CSV Import/Export

**Date:** 2026-03-25
**Status:** Review

## Problem

Contacts in Quote Plus are identified by phone number, but the same client/company often calls from multiple numbers (employees' personal phones, office lines, etc.). Notes end up scattered across separate contact records, making it hard to get a unified view of interactions with a client.

Additionally, there is no way to bulk import/export contacts via CSV, unlike products which already have this feature.

## Solution Overview

Two interrelated features:

1. **Contact Groups** — A `ContactGroup` entity that logically groups multiple phone numbers (contacts) under one client/company. Notes are displayed unified across all contacts in a group.
2. **Contact CSV Import/Export** — Bulk import/export in the settings page (mirroring the product import/export), with group assignment support.

---

## 1. Schema Changes

### New Model: `ContactGroup`

```prisma
model ContactGroup {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  company   String?
  label     String?   @default("")
  createdAt DateTime  @default(now()) @map(name: "created_at")
  createdBy String    @map(name: "created_by")
  updatedAt DateTime  @updatedAt @map(name: "updated_at")
  updatedBy String    @map(name: "updated_by")
  contacts  Contact[]
}
```

Note: `name` has a `@unique` constraint to prevent duplicate groups and ensure deterministic matching during CSV import.

### Modified Model: `Contact`

Add nullable foreign key to `ContactGroup`:

```prisma
model Contact {
  // ... existing fields ...
  groupId     Int?          @map(name: "group_id")
  group       ContactGroup? @relation(fields: [groupId], references: [id], onDelete: SetNull)
}
```

Contacts without a group continue to work as before. No breaking changes.

---

## 2. Contact Group UX

### Linking a contact to a group (from contact detail view)

1. User opens a contact's detail card
2. Clicks "Collega a gruppo" (Link to group)
3. A search modal appears — user types name or company
4. Fuzzy search returns matching ContactGroups
5. User selects an existing group → contact's `groupId` is set
6. OR user clicks "Crea nuovo gruppo" (Create new group) → modal with name field pre-filled from contact's name/company, editable → creates group and assigns contact

### Unlinking a contact from a group

1. From contact detail, if contact has a group, show group name + "Scollega" (Unlink) button
2. Click → sets `groupId` to null
3. If the group has no more contacts after unlinking, optionally delete the empty group

### Relinking to a different group

User unlinks from current group, then links to a new one. Same flow as above.

### Unified notes view

When viewing a contact that belongs to a group:
- Show a badge/label with the group name
- Display notes from ALL contacts in the same group, ordered chronologically
- Each note shows which phone number it came from (so context is preserved)

---

## 3. CSV Export

### Endpoint: `GET /api/contacts/export-csv-full`

- Exports all contacts with all fields
- Semicolon-delimited CSV with UTF-8 BOM
- Header row included (serves as template for import)
- Filename: `contacts_YYYY-MM-DD.csv`

### CSV Columns

```
id;phoneNumber;firstName;lastName;company;mobile;mobile2;home;home2;business;business2;email;businessFax;homeFax;pager;other;whatsapp;telegram;label;gruppo
```

- `id`: contact ID (empty for new contacts in import)
- `gruppo`: name of the ContactGroup (empty if no group)
- All other fields map directly to Contact model fields

### Escaping

Same `escapeCsv()` function used by product export: quotes fields containing semicolons, double-quotes, or newlines.

---

## 4. CSV Import

### Endpoint: `POST /api/contacts/import-csv-full`

- Size limit: 4MB
- Input: `{ csv: string, mode: "validate" | "execute", createdBy: string }`
- `createdBy` is the username string (e.g. "admin"), set on both `createdBy` and `updatedBy` fields of created/updated contacts and groups
- Semicolon-delimited, first row is header (skipped)

### Two-Phase Process

**Validate mode** — returns preview without saving:
```json
{
  "totalRows": 150,
  "toCreate": 120,
  "toUpdate": 30,
  "newGroups": ["Azienda Nuova S.r.l.", "Studio Bianchi"],
  "errors": [
    "Riga 5: phoneNumber obbligatorio",
    "Riga 12: phoneNumber duplicato nel CSV (riga 3)"
  ]
}
```

**Execute mode** — performs actual import (wrapped in `prisma.$transaction()` for atomicity):
```json
{
  "created": 120,
  "updated": 30,
  "groupsCreated": 2
}
```

### Match Logic

- If `id` is present and matches an existing contact → **update**
- Else if `phoneNumber` matches an existing contact → **update**
- Else → **create**

### Validation Rules

Per-row validation:
- `phoneNumber` is **required** and non-empty
- `phoneNumber` must not be duplicated within the CSV itself
- `email` if present must be valid format
- All other fields are optional strings

Cross-reference:
- If `gruppo` column is filled, look up existing ContactGroup by name. If not found, it will be created on execute.
- `createdBy` / `updatedBy` are set automatically from the `createdBy` parameter (username string)
- Audit fields (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`) are excluded from CSV columns and auto-populated

### Group Handling on Import

- If `gruppo` column is empty → contact has no group (`groupId = null`)
- If `gruppo` matches an existing group name → assign contact to that group
- If `gruppo` doesn't match any existing group → create the group on execute, assign contact

---

## 5. Settings Page UI

New section in settings page, below the existing product import/export section.

### Section: "Gestione Contatti"

Two buttons:
- **"Esporta contatti CSV"** → opens `/api/contacts/export-csv-full` in new tab (download)
- **"Importa contatti CSV"** → hidden file input (`.csv`), triggers two-phase import flow

### Import Flow (identical UX to products)

1. User clicks "Importa contatti CSV"
2. File picker opens → user selects CSV
3. File is read → POST to import endpoint with `mode: "validate"`
4. Preview dialog shows:
   - Total rows, to create, to update
   - New groups to be created (blue info box)
   - Errors if any (red error box)
5. If no errors → "Conferma importazione" button
6. User confirms → POST with `mode: "execute"`
7. Success dialog: contacts created, updated, groups created

### Error Display

Errors are shown per-row with row number and message, same pattern as product import.

---

## 6. Translations (i18n)

Keys under `settings.contactsImportExport.*` in both `it.json` and `en.json`:

| Key | IT | EN |
|-----|----|----|
| title | Gestione contatti | Contact management |
| export | Esporta contatti CSV | Export contacts CSV |
| import | Importa contatti CSV | Import contacts CSV |
| preview | Anteprima importazione | Import preview |
| totalRows | Righe totali | Total rows |
| toCreate | Da creare | To create |
| toUpdate | Da aggiornare | To update |
| newGroups | Nuovi gruppi da creare | New groups to create |
| errors | Errori | Errors |
| confirmImport | Conferma importazione | Confirm import |
| importDone | Importazione completata! | Import completed! |
| created | Contatti creati | Contacts created |
| updated | Contatti aggiornati | Contacts updated |
| groupsCreated | Nuovi gruppi creati | New groups created |

Additional i18n keys for group management in contact detail:
- `contact.linkToGroup` — Collega a gruppo / Link to group
- `contact.unlinkFromGroup` — Scollega dal gruppo / Unlink from group
- `contact.createNewGroup` — Crea nuovo gruppo / Create new group
- `contact.groupName` — Nome gruppo / Group name
- `contact.group` — Gruppo / Group

---

## 7. Files to Create/Modify

### New Files
- `pages/api/contacts/export-csv-full.ts` — Export endpoint
- `pages/api/contacts/import-csv-full.ts` — Import endpoint
- `pages/api/contact-groups/search.ts` — Fuzzy search endpoint for group linking UI
  - `GET /api/contact-groups/search?q=<query>`
  - Returns `{ results: ContactGroup[] }` (max 10 results)
  - Searches `name` and `company` fields with case-insensitive `contains`

### Modified Files
- `prisma/schema.prisma` — Add ContactGroup model, add groupId to Contact
- `pages/settings/index.tsx` — Add contacts import/export section
- `dictionaries/it.json` — Add Italian translations
- `dictionaries/en.json` — Add English translations
- Contact detail component (TBD) — Add group link/unlink UI, unified notes view

### Migration
- Prisma migration for new ContactGroup table and Contact.groupId column

---

## 8. Out of Scope

- Quick export/import (no equivalent of "price-only" update for contacts)
- Automatic merge suggestions based on name similarity (future enhancement)
- ContactGroup CRUD management page (groups are managed from contact detail only)
- Bulk group assignment from contact list view
