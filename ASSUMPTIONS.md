# Assumptions

The brief leaves some behaviour open. These are the decisions made, and why.
Each entry is added in the same pull request as the code that implements it.

## Identity and input

| # | Assumption | Reason |
|---|---|---|
| 1 | `X-Student-Id` must be exactly 17 ASCII digits. Anything else returns `400`. | The brief defines it as the 17-digit birth registration number. Rejecting bad values early keeps garbage out of the database. |
| 2 | A missing `X-Student-Id` on an endpoint that lists the header returns `400`. | The request cannot be attributed to a student. |
| 3 | `GET /holds/{holdId}` does not require `X-Student-Id`. | The contract does not list the header for this endpoint, and the API must match the contract exactly. |
| 4 | Class `name` must be non-empty after trimming; `totalSeats` must be a positive integer. | A class without a name or with zero seats is not meaningful. |
| 5 | Every validation failure returns `4xx` with `{ "error": "<code>", "message": "<text>" }`. Unknown or malformed IDs return `404`. | Rule 7 forbids `500` for bad input, and a stable error code lets the UI show a clear message. |
| 6 | IDs are opaque strings (a prefix plus a GUID, e.g. `c_…`, `h_…`). | The brief leaves the format open. GUIDs are not guessable and need no central counter. |

## Holds and seats

| # | Assumption | Reason |
|---|---|---|
| 7 | `availableSeats = totalSeats − heldSeats − confirmedSeats`, counting only holds that have not expired. | An expired hold must free its seat immediately, without anyone calling an API. |
| 8 | "No seats" and "you already applied to this class" both return `409`, told apart by the `error` code. | Both are conflicts with the current state; the code tells the UI which message to show. |
| 9 | A student may apply again to a class after their previous hold there expired or was cancelled. | The rule only forbids more than one *active* hold or confirmed admission per class at the same time. |
| 10 | A student may hold seats in different classes at the same time. | The one-at-a-time rule is per class. |
| 11 | Only the student who owns a hold may confirm or cancel it. Anyone else gets `403`. | Rule 4: only your own hold can be confirmed. |
| 12 | Confirming an already `CONFIRMED` hold returns `200` with the same body and does not count a second seat. | Rule 5 requires `confirmedSeats` to rise only once; idempotency also makes a double-clicked "Pay" button safe. |
| 13 | Confirming an expired or cancelled hold returns `409`. Cancelling a hold that is not `HELD` returns `409`. | The action conflicts with the hold's current state. |
| 14 | A `CONFIRMED` admission cannot be cancelled through the API. | Cancelling would need a refund flow, which is out of scope (payment is simulated). |
| 15 | The hold's expiry time is taken from the database clock, not the app server clock. | With several backend processes, one clock means they can never disagree about whether a hold has expired. |
| 24 | A held seat whose time ran out is reported as `EXPIRED` the moment it runs out. A background sweeper also saves `EXPIRED` in the database every `EXPIRY_SWEEP_SECONDS` (default 5; `0` turns it off). | Correctness never waits for the sweeper: seat counts and every read already treat the hold as expired. The sweeper only keeps the stored status true for anyone reading the database directly. |

## Concurrency (bonus: several backend processes)

The seat rules must hold with any number of backend processes on one database, so none of them relies on memory inside one process. Everything that must be decided once is decided by PostgreSQL:

- **One application at a time per class.** Creating a hold runs in one transaction that first locks the class row (`SELECT … FOR UPDATE`). Applications for the same class, from any process, wait for each other, so the seat check and the insert can never interleave. Applications for different classes do not wait for each other.
- **Duplicates.** A partial unique index on `(class_id, student_id)` for `HELD`/`CONFIRMED` rows is a second guard against two active applications by one student; a violation is answered with `409`, never `500`.
- **Pay and cancel.** Both lock the hold's row, so two of them on the same hold (or a pay and a cancel) run one after another; paying twice confirms once.
- **One clock.** Expiry is judged by the database clock, which every process shares, so two processes can never disagree about whether a hold has expired.
- **Expiry sweeper.** Every process runs it. Its single `UPDATE … WHERE status = 'HELD' AND expires_at <= now()` is safe to repeat and to run at the same time: PostgreSQL re-checks the condition after waiting for a row lock, so a hold paid meanwhile is left alone.
- **Schema changes.** Only the first backend applies migrations at startup; the second one waits until the first reports healthy, so two processes never create the schema at the same time.
- **Connections.** Each process opens at most `DB_POOL_SIZE` (default 40) connections, so two fit within PostgreSQL's limit of 100.

How it was checked: `docker compose --profile multi up -d` starts a second backend on port 8081 with the same database. Tests send 200 simultaneous applications for a 10-seat class alternately to both processes: exactly 10 succeed and both report the same seat counts. The same holds for duplicate applications and double payments. The tests run against two app instances by default, and against the real containers with `MULTI_BACKEND_URLS=http://localhost:8080,http://localhost:8081`. Removing the class-row lock makes them fail.

## Frontend

| # | Assumption | Reason |
|---|---|---|
| 16 | The student ID typed in the top bar is saved in `localStorage`. | Rule 11: after a refresh or browser restart the student must still see their applications. |
| 17 | Seat counts and hold status refresh every few seconds by polling. | Simple and robust; meets "updates without reload" without adding WebSockets. |
| 18 | The backend URL is injected when the frontend container starts (`config.js`), not at build time. | The brief requires changing it through an environment variable; Vite would otherwise bake it into the build. |
| 19 | The UI has two areas: a **parent portal** at `/` (classes, application, my applications) and an **admin console** at `/admin` (classes table, "New class"). Parent pages do not link to admin actions; a small footer link leads to the console. | Parents and school staff do different jobs. Showing "Create class" next to "My applications" suggested parents could create classes. |
| 20 | `/admin` has no sign-in. In real use it would sit behind staff authentication. | The brief says login is not needed, and the API has no admin role. |
| 21 | The student ID field appears only in the parent header, not in the admin console. | Creating classes does not use `X-Student-Id`. |
| 22 | The frontend uses **React 19**. | The brief asks for React 18 or newer; 19 is the current stable major and needs no extra code. |
| 23 | Components come from **MUI 7** with a custom light theme (Inter and Noto Sans Bengali fonts, the school's green and gold). There is no dark mode. | MUI gives accessible inputs, dialogs, menus and notifications out of the box, so time goes into the admission logic rather than hand-written widgets. One light theme keeps the screens consistent. |
| 25 | The portal belongs to a fictional school, **Onnorokom School & College**, with a crest, contact details and admission notices. The phone number and email are placeholders, and the footer says the school is fictional. | Parents trust a page that looks like their school's own website and tells them the rules, dates and whom to call. The brief names no school, and a made-up one avoids impersonating a real one. |
| 26 | Text is in English, with Bangla on the main buttons and headings (আবেদন করুন, ভর্তি ফি দিন, বাতিল, আমার আবেদন). | The brief names these screens and buttons in Bangla, and Bangladeshi school sites are usually bilingual. English stays the main language so every reviewer can read it. |
| 27 | The class and the shift are read from the class name ("Class 6 - Morning Shift" → Class 6, Morning) to group and filter classes. Names in another form still work and are listed under their own name. The New class form offers Class and Shift pickers that write names in this form. | The API contract has only `name` for a class, and adding fields is optional. Reading the name keeps the contract unchanged. |
| 28 | The home page has a notice board, admission rules and a help page with frequently asked questions. The notices are sample content written into the frontend. | A real admission portal explains the rules before people apply; managing notices from the admin console is beyond this task. |
| 29 | The hold length is not shown before applying ("a limited time"); after applying, the application page shows the exact countdown and deadline. | The API does not publish `HOLD_DURATION_SECONDS`; the deadline arrives with each hold as `expiresAt`. |
