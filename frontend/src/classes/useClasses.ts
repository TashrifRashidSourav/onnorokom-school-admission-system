import { useQuery } from '@tanstack/react-query'
import { listClasses } from '../api/endpoints'
import { queryKeys } from '../api/queryClient'

/** Every class with its seat counts (GET /classes). Shared by the parent and admin pages. */
export function useClasses() {
  return useQuery({
    queryKey: queryKeys.classes,
    queryFn: listClasses,
  })
}
