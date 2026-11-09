import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './client'

/** Query keys in one place, so invalidation after a change hits the right data. */
export const queryKeys = {
  classes: ['classes'] as const,
  class: (classId: string) => ['classes', classId] as const,
  hold: (holdId: string) => ['holds', holdId] as const,
  myHolds: ['me', 'holds'] as const,
}

/**
 * Retry only failures that a retry can fix: the server being unreachable or a
 * 5xx. A 4xx (bad input, not found, no seats) will fail the same way again.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false
  }
  return failureCount < 2
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      // Data counts as fresh for a moment; pages that must stay live set refetchInterval.
      staleTime: 2_000,
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Never repeat a POST/DELETE automatically: the user decides.
      retry: false,
    },
  },
})
