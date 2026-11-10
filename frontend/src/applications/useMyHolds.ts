import { useQuery } from '@tanstack/react-query'
import { listMyHolds } from '../api/endpoints'
import { queryKeys } from '../api/queryClient'

/**
 * Every application of the current student (GET /me/holds). The student ID is part of
 * the key, so switching students never shows the previous student's list. Nothing is
 * loaded until an ID is entered.
 */
export function useMyHolds(studentId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.myHolds, studentId],
    queryFn: listMyHolds,
    enabled: studentId !== null,
  })
}
