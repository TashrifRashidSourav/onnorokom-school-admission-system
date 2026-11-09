// Same rules as the backend's CreateClassValidator, so most mistakes are caught
// before a request is sent. The backend still checks everything.

export const MAX_NAME_LENGTH = 200
export const MIN_SEATS = 1
export const MAX_SEATS = 10_000

export interface CreateClassErrors {
  name?: string
  seats?: string
}

export function validateClassName(name: string): string | undefined {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return 'Enter a class name, e.g. "Class 6 - Morning Shift".'
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return `Class name must be at most ${MAX_NAME_LENGTH} characters (now ${trimmed.length}).`
  }
  return undefined
}

export function validateSeats(seats: string): string | undefined {
  const trimmed = seats.trim()
  if (trimmed.length === 0) {
    return 'Enter the number of seats.'
  }
  if (!/^\d+$/.test(trimmed)) {
    return 'Number of seats must be a whole number.'
  }
  const value = Number(trimmed)
  if (value < MIN_SEATS || value > MAX_SEATS) {
    return `Number of seats must be between ${MIN_SEATS} and ${MAX_SEATS.toLocaleString('en-US')}.`
  }
  return undefined
}

export function validateCreateClass(name: string, seats: string): CreateClassErrors {
  return { name: validateClassName(name), seats: validateSeats(seats) }
}

export function hasErrors(errors: CreateClassErrors): boolean {
  return errors.name !== undefined || errors.seats !== undefined
}
