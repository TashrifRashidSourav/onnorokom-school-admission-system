import { useQuery } from '@tanstack/react-query'
import { listClasses } from '../api/endpoints'
import { queryKeys } from '../api/queryClient'

/** How often seat counts are reloaded while the page is open. */
export const SEAT_REFRESH_MS = 3_000

/**
 * Every class with its seat counts (GET /classes). Shared by the parent and admin pages.
 * Reloads every few seconds, so seats taken by other people, and holds that expire,
 * show up without a page reload. Pauses while the browser tab is hidden.
 */
export function useClasses() {
  return useQuery({
    queryKey: queryKeys.classes,
    queryFn: listClasses,
    refetchInterval: SEAT_REFRESH_MS,
    refetchIntervalInBackground: false,
  })
}
