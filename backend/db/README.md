# AutoParts database

PostgreSQL on Neon. The tables follow the team's E-R and schema diagrams.

| File | What it is |
|---|---|
| `schema.sql` | All 9 tables with their keys and constraints. Matches the live Neon database exactly (61 columns, 33 constraints, checked 2026-11-16). |
| `views.sql` | `order_total` view: the derived `total()` attribute of `orders`. Not yet created in Neon. |
| `seed.sql` | The example data from Neon, with plain-text test passwords. |
| `setup.js` | Runs the three files above in one transaction (`npm run db:setup`). |
| `../db.js` | The shared connection pool the API uses. |

## Connecting

1. Install the [Neon CLI](https://neon.com/docs/reference/neon-cli) and log in.
2. From the repo root, run `neon env pull`. This writes `DATABASE_URL` to `.env.local`.
   **Never commit `.env.local`** (it is in `.gitignore`).
3. `cd backend`, `npm install`, `npm run dev`, then open http://localhost:3001/api/health.

## Your own copy of the database

To test without touching the shared data, make a personal Neon branch
(`neon checkout <your-name>`, which expires after 7 days), point `.env.local`
at it, and run `npm run db:setup`. The script refuses to run if the tables
already exist, so it cannot overwrite the shared database.

## Test accounts (from `seed.sql`)

All use the password `password123`.

| Type | Username |
|---|---|
| Customer | `JohnSmith123`, `Jane-Doe-456` |
| Employee | `MannyGer246` (store 1 manager), `SquidTen11` |

## Known gaps to decide on as a team

These differ from the diagrams or will matter for the app. None have been changed.

1. **Passwords in Neon are plain text**, not hashes. Good for demo in class. Please replace with encryption/encrypted passwords for deployment.
2. **`inventory.store_number` has no foreign key** to `store`, although the
   diagram shows one. Fix:
   `ALTER TABLE inventory ADD CONSTRAINT store_number FOREIGN KEY (store_number) REFERENCES store (store_number);`
3. **No automatic IDs.** `part_id`, `employee_id`, `order_id`, `payment_id` and
   `delivery_id` have no default, so the API must generate them (or the team
   can add sequences / identity columns).
4. **`orders.employee_id` is NOT NULL**, so every online order still needs an
   employee assigned.
5. **`payment.status` uses the order status list** (`shipped`, `returned`, ...).
   Payments probably only need `pending`, `paid`, `failed`, `refunded`.
6. **`card_num` is `VARCHAR(12)`**, too short for a 16-digit card. Better to
   store only the last 4 digits.
7. Column names say `phone_number` while the diagrams say `phone`; dates are
   `TIMESTAMP` where the schema diagram says `DATE`. Update the diagrams or
   keep this in mind when writing queries.
