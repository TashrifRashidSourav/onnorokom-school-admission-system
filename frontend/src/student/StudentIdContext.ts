import { createContext, useContext } from 'react'

export interface StudentIdState {
  /** The current student's 17-digit ID, or null until one is entered. */
  studentId: string | null
  setStudentId: (studentId: string) => void
  clearStudentId: () => void
}

export const StudentIdContext = createContext<StudentIdState | null>(null)

export function useStudentId(): StudentIdState {
  const state = useContext(StudentIdContext)
  if (state === null) {
    throw new Error('useStudentId must be used inside <StudentIdProvider>')
  }
  return state
}
