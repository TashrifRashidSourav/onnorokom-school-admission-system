import { useQuery } from '@tanstack/react-query'
import { getHold } from '../api/endpoints'
import { queryKeys } from '../api/queryClient'

/** How often a running application is checked for changes made elsewhere (another tab). */
const HOLD_REFRESH_MS = 3_000

/**
 * One application (GET /holds/{holdId}). While it is HELD it is reloaded every few
 * seconds; CONFIRMED, EXPIRED and CANCELLED never change again, so polling stops.
 */
export function useHold(holdId: string) {
  return useQuery({
    queryKey: queryKeys.hold(holdId),
    queryFn: () => getHold(holdId),
    refetchInterval: (query) => (query.state.data?.status === 'HELD' ? HOLD_REFRESH_MS : false),
  })
}
