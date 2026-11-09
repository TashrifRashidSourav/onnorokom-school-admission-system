// Types mirroring the backend API contract field for field.
// Keep names identical to the JSON the API returns.

/** Body of POST /classes. */
export interface CreateClassInput {
  name: string
  totalSeats: number
}

/** Response of POST /classes. */
export interface CreatedClass {
  id: string
  name: string
  totalSeats: number
}

/** Item of GET /classes and response of GET /classes/{classId}. */
export interface ClassSummary {
  id: string
  name: string
  totalSeats: number
  heldSeats: number
  confirmedSeats: number
  availableSeats: number
}

export type HoldStatus = 'HELD' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED'

/** Response of POST /classes/{classId}/holds (apply for a seat). */
export interface CreatedHold {
  holdId: string
  classId: string
  studentId: string
  status: HoldStatus
  /** ISO-8601 UTC timestamp, e.g. "2026-11-01T04:10:00Z". */
  expiresAt: string
}

/** Response of GET /holds/{holdId}. */
export interface HoldDetails {
  holdId: string
  classId: string
  status: HoldStatus
  expiresAt: string
}

/** Response of POST /holds/{holdId}/confirm. */
export interface ConfirmedHold {
  holdId: string
  status: HoldStatus
}

/** Item of GET /me/holds. */
export interface MyHold {
  holdId: string
  classId: string
  className: string
  status: HoldStatus
  expiresAt: string
}

/** Body of every error response: a stable code plus a plain-language message. */
export interface ApiErrorBody {
  error: string
  message: string
}
