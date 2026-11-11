# Assumptions

Where the brief leaves something open, this is what I decided and why.

## Identity and input

| # | Assumption | Reason |
|---|---|---|
| 1 | `X-Student-Id` must be exactly 17 ASCII digits. Missing or invalid returns `400`. | The brief defines it as the 17-digit birth registration number; bad values never reach the database. |
| 2 | `GET /holds/{holdId}` needs no `X-Student-Id`. | The contract does not list the header there, and the API must match the contract exactly. |
| 3 | A class name must be 1–200 characters after trimming; `totalSeats` must be a whole number from 1 to 10,000. | A class without a name or seats is meaningless; the limits stop absurd input. |
| 4 | Every bad request gets a `4xx` with `{ "error": "<code>", "message": "<text>" }`, never a `500`. Unknown or malformed IDs return `404`. | Rule 7. The stable `error` code lets the UI show its own plain-language message. |
| 5 | IDs are a prefix plus a GUID (`c_…`, `h_…`). | The brief leaves the format open; GUIDs cannot be guessed and need no shared counter. |

## Holds and seats

| # | Assumption | Reason |
|---|---|---|
| 6 | `availableSeats = totalSeats − heldSeats − confirmedSeats`, where a held seat counts only until it expires. Expiry is judged by the database clock. | An expired hold must free its seat at once, with no API call (rule 2). One clock means several backend processes always agree. |
| 7 | A held seat past its time reads as `EXPIRED` immediately. A background sweeper also saves `EXPIRED` every `EXPIRY_SWEEP_SECONDS` (default 5; `0` turns it off). | Correctness never waits for the sweeper; it only keeps the stored status true for anyone reading the database. |
| 8 | "No seats left" and "already applied to this class" are both `409`, told apart by the `error` code (`class_full`, `already_applied`). | Both conflict with the current state; the code tells the UI which message to show. |
| 9 | A student may apply again after an application expired or was cancelled, and may hold seats in several classes at once. | Rule 3 only forbids two *active* applications or admissions in the same class. |
| 10 | Only the student who applied may pay or cancel; anyone else gets `403`. | Rule 4. |
| 11 | Paying an already paid application returns `200` with the same body and counts the seat once. | Rule 5; it also makes a double-clicked Pay button harmless. |
| 12 | Paying an expired or cancelled application, or cancelling one that is not `HELD`, returns `409`. A paid admission cannot be cancelled online. | These conflict with the application's state; cancelling a paid admission would need a refund flow, which is out of scope. |
| 13 | Payment is simulated: "ভর্তি ফি দিন" (Pay admission fee) confirms the admission at once. | The brief says pressing the button counts as a successful payment. |

## Several backend processes (bonus)

No rule depends on memory inside one process; PostgreSQL decides:

- **No overbooking.** Applying runs in one transaction that first locks the class row (`SELECT … FOR UPDATE`), so applications for the same class, from any process, run one after another.
- **No duplicates.** A partial unique index on `(class_id, student_id)` for `HELD`/`CONFIRMED` rows is a second guard; a violation becomes `409`, not `500`.
- **Pay and cancel** lock the application's row, so paying twice, or paying and cancelling at once, end in exactly one result.
- **The expiry sweeper** runs in every process; its single `UPDATE … WHERE status = 'HELD' AND expires_at <= now()` is safe to repeat and leaves an application paid meanwhile alone.
- **Startup:** only the first backend applies migrations; the second waits until the first is healthy. Each process opens at most `DB_POOL_SIZE` (default 40) connections, so two fit within PostgreSQL's 100.

Checked with `docker compose --profile multi up -d` (a second backend on port 8081): 200 simultaneous applications for 10 seats, split across both processes, give exactly 10 seats, and both report the same counts. Removing the class-row lock makes the test fail.

## Frontend

| # | Assumption | Reason |
|---|---|---|
| 14 | The student ID is kept in `localStorage`. | Rule 11: after a refresh or browser restart the student still sees their applications. |
| 15 | Seat counts and statuses are refreshed every 3 seconds by polling. | Simple and robust; meets "updates without reload" without WebSockets. |
| 16 | The backend URL (`API_URL`) is written into `config.js` when the frontend container starts, not at build time. | The brief requires changing it with an environment variable without rebuilding. |
| 17 | Parents use the portal at `/`; school staff use a separate admin console at `/admin`, without the student ID box and without sign-in. The parent pages offer no admin actions; only a small footer link leads to the console. | Parents and staff do different jobs, and showing "Create class" beside "My applications" would suggest parents can create classes. The brief needs no login; in real use the console would sit behind staff sign-in. |
| 18 | The portal belongs to a fictional school, **Onnorokom School & College**, with a crest, placeholder contact details, sample admission notices, rules and a help page. The footer says the school is fictional. | Parents trust and understand a page that looks like their school's own site and explains the rules. A made-up school avoids impersonating a real one. |
| 19 | English is the main language; the key buttons and headings also show Bangla (আবেদন করুন, ভর্তি ফি দিন, বাতিল, আমার আবেদন). | The brief names these in Bangla, and local school sites are usually bilingual; English keeps it readable for every reviewer. |
| 20 | Class and shift are read from the class name ("Class 6 - Morning Shift" → Class 6, Morning) to group and filter classes; other names still work. The New class form has Class and Shift pickers that write names in this form. | The contract has only `name`; reading it keeps the API unchanged. |
| 21 | The hold length is not shown before applying; afterwards the application page shows the exact countdown and deadline. | The API does not publish `HOLD_DURATION_SECONDS`; each hold carries its own `expiresAt`. |
| 22 | React 19 with MUI 7 and one light theme; no dark mode. | The brief asks for React 18 or newer. MUI gives accessible forms and dialogs, so time went into the admission rules. |
