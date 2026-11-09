import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { setRequestStudentId } from '../api/client'
import { queryKeys } from '../api/queryClient'
import { StudentIdContext, type StudentIdState } from './StudentIdContext'
import { isValidStudentId, loadStudentId, saveStudentId } from './studentId'

/** Loads the saved ID and hands it to the API client before anything renders. */
function initialStudentId(): string | null {
  const saved = loadStudentId()
  setRequestStudentId(saved)
  return saved
}

/**
 * Holds the current student ID for the whole app and keeps it in localStorage,
 * so a refresh or a browser restart keeps the student "signed in" (rule 11).
 * Every API request carries it as the X-Student-Id header.
 */
export function StudentIdProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [studentId, setState] = useState<string | null>(initialStudentId)

  const apply = useCallback(
    (next: string | null) => {
      // Update the header before re-rendering so no request goes out with the old ID.
      setRequestStudentId(next)
      saveStudentId(next)
      setState(next)
      // Data that belongs to the previous student must not be shown to the new one.
      queryClient.removeQueries({ queryKey: queryKeys.myHolds })
      queryClient.removeQueries({ queryKey: ['holds'] })
    },
    [queryClient],
  )

  const setStudentId = useCallback(
    (next: string) => {
      if (!isValidStudentId(next)) {
        throw new Error('Student ID must be exactly 17 digits')
      }
      apply(next)
    },
    [apply],
  )

  const clearStudentId = useCallback(() => apply(null), [apply])

  const value = useMemo<StudentIdState>(
    () => ({ studentId, setStudentId, clearStudentId }),
    [studentId, setStudentId, clearStudentId],
  )

  return <StudentIdContext.Provider value={value}>{children}</StudentIdContext.Provider>
}
