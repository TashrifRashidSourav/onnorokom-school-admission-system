import { ApiError, NETWORK_ERROR, UNEXPECTED_RESPONSE } from './client'

/**
 * Plain-language text for the backend's stable error codes. The UI owns this wording,
 * so it can say what to do next; codes not listed here fall back to the server's own
 * message, which is already written for people.
 */
const messages: Record<string, string> = {
  [NETWORK_ERROR]: 'Cannot reach the server. Check your internet connection, or try again in a moment.',
  student_id_required: 'Enter the student\'s 17-digit birth registration number at the top of the page first.',
  invalid_student_id:
    'The student ID must be exactly 17 digits (the birth registration number). Check it at the top of the page.',
  class_full: 'All seats in this class are taken. A seat may open up if an application expires or is cancelled.',
  already_applied: 'This student already has an application for this class. You can find it under My applications.',
  not_your_application:
    'This application belongs to a different student. Check the student ID at the top of the page.',
  hold_expired: 'The time to pay for this application ran out and the seat was released. Apply again if a seat is free.',
  hold_cancelled: 'This application was cancelled, so it cannot be paid for or cancelled again.',
  hold_confirmed: 'The fee for this application is already paid, so it cannot be cancelled.',
  invalid_json: 'The request could not be read. Please reload the page and try again.',
  unsupported_media_type: 'The request could not be read. Please reload the page and try again.',
  method_not_allowed: 'This action is not available. Please reload the page and try again.',
  internal_error: 'Something went wrong on the server. Please try again in a moment.',
  [UNEXPECTED_RESPONSE]:
    'The server sent an answer this page does not understand. Please reload the page; if it keeps happening, try again later.',
}

/**
 * What to tell the user about a failed request, in one sentence or two.
 * `fallback` is used for anything that is not an ApiError (a bug in the page, say).
 */
export function describeError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!(error instanceof ApiError)) {
    return fallback
  }
  const known = messages[error.code]
  if (known !== undefined) {
    return known
  }
  if (error.status >= 500) {
    return messages.internal_error
  }
  // validation_failed, not_found and others: the server explains the specific problem.
  return error.message || fallback
}
