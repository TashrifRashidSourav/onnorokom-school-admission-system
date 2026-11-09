import { request } from './client'
import type {
  ClassSummary,
  ConfirmedHold,
  CreateClassInput,
  CreatedClass,
  CreatedHold,
  HoldDetails,
  MyHold,
} from './types'

// One function per endpoint in the API contract. Endpoints that need the student
// identity get the X-Student-Id header from the client (see student ID bar).

const segment = encodeURIComponent

/** 1. POST /classes: school admin creates a class (one shift). */
export const createClass = (input: CreateClassInput) =>
  request<CreatedClass>('/classes', { method: 'POST', body: input })

/** 2. GET /classes: every class with its seat counts. */
export const listClasses = () => request<ClassSummary[]>('/classes')

/** 3. GET /classes/{classId}: seat counts of one class. */
export const getClass = (classId: string) => request<ClassSummary>(`/classes/${segment(classId)}`)

/** 4. POST /classes/{classId}/holds: apply, which holds a seat for a limited time. */
export const applyForSeat = (classId: string) =>
  request<CreatedHold>(`/classes/${segment(classId)}/holds`, { method: 'POST' })

/** 5. GET /holds/{holdId}: current status of an application. */
export const getHold = (holdId: string) => request<HoldDetails>(`/holds/${segment(holdId)}`)

/** 6. POST /holds/{holdId}/confirm: pay the admission fee, confirming the seat. */
export const confirmHold = (holdId: string) =>
  request<ConfirmedHold>(`/holds/${segment(holdId)}/confirm`, { method: 'POST' })

/** 7. DELETE /holds/{holdId}: cancel an application. */
export const cancelHold = (holdId: string) =>
  request<void>(`/holds/${segment(holdId)}`, { method: 'DELETE' })

/** 8. GET /me/holds: all applications of the current student. */
export const listMyHolds = () => request<MyHold[]>('/me/holds')
