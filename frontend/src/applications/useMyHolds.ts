import { useQuery } from '@tanstack/react-query'
import { listMyHolds } from '../api/endpoints'
import { queryKeys } from '../api/queryClient'

/** How often the list is reloaded while a seat is held, to catch changes made elsewhere. */
const MY_HOLDS_REFRESH_MS = 3_000

/**
 * Every application of the current student (GET /me/holds). The student ID is part of
 * the key, so switching students never shows the previous student's list. Nothing is
 * loaded until an ID is entered. While any seat is held the list is reloaded every few
 * seconds (paid or cancelled in another tab, expired); otherwise it reloads when the
 * window gets focus again, e.g. after applying in another tab.
 */
export function useMyHolds(studentId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.myHolds, studentId],
    queryFn: listMyHolds,
    enabled: studentId !== null,
    refetchInterval: (query) =>
      query.state.data?.some((hold) => hold.status === 'HELD') ? MY_HOLDS_REFRESH_MS : false,
  })
}
