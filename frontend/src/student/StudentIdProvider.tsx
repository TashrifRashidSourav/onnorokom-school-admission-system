import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { StudentIdContext, type StudentIdState } from './StudentIdContext'
import { isValidStudentId, loadStudentId, saveStudentId } from './studentId'

/**
 * Holds the current student ID for the whole app and keeps it in localStorage,
 * so a refresh or a browser restart keeps the student "signed in" (rule 11).
 */
export function StudentIdProvider({ children }: { children: ReactNode }) {
  const [studentId, setState] = useState<string | null>(loadStudentId)

  const setStudentId = useCallback((next: string) => {
    if (!isValidStudentId(next)) {
      throw new Error('Student ID must be exactly 17 digits')
    }
    saveStudentId(next)
    setState(next)
  }, [])

  const clearStudentId = useCallback(() => {
    saveStudentId(null)
    setState(null)
  }, [])

  const value = useMemo<StudentIdState>(
    () => ({ studentId, setStudentId, clearStudentId }),
    [studentId, setStudentId, clearStudentId],
  )

  return <StudentIdContext.Provider value={value}>{children}</StudentIdContext.Provider>
}
