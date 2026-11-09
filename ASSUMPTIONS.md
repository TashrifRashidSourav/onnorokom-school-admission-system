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

## Concurrency (bonus: several backend processes)

_(details added with #9 and #20)_

- Creating a hold runs in one transaction that first locks the class row (`SELECT … FOR UPDATE`). Concurrent requests for the same class, from any process, are processed one at a time, so the seat check and the insert cannot interleave.
- A partial unique index on `(class_id, student_id)` for `HELD`/`CONFIRMED` rows is a second guard against duplicate active holds; a violation is turned into `409`.

## Frontend

| # | Assumption | Reason |
|---|---|---|
| 16 | The student ID typed in the top bar is saved in `localStorage`. | Rule 11: after a refresh or browser restart the student must still see their applications. |
| 17 | Seat counts and hold status refresh every few seconds by polling. | Simple and robust; meets "updates without reload" without adding WebSockets. |
| 18 | The backend URL is injected when the frontend container starts (`config.js`), not at build time. | The brief requires changing it through an environment variable; Vite would otherwise bake it into the build. |
