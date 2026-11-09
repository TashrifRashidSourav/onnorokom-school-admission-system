/** The student's 17-digit birth registration number is their identity (no login). */
export const STUDENT_ID_LENGTH = 17

const STORAGE_KEY = 'admission.studentId'

/** Exactly 17 ASCII digits, the same rule the backend enforces. */
export function isValidStudentId(value: string): boolean {
  return /^[0-9]{17}$/.test(value)
}

/**
 * Reads the saved ID. Storage can be unavailable (private mode, blocked site data),
 * so failures simply mean "no saved ID".
 */
export function loadStudentId(): string | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved !== null && isValidStudentId(saved) ? saved : null
  } catch {
    return null
  }
}

export function saveStudentId(studentId: string | null): void {
  try {
    if (studentId === null) {
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      window.localStorage.setItem(STORAGE_KEY, studentId)
    }
  } catch {
    // Storage unavailable: the ID still works for this page session.
  }
}
