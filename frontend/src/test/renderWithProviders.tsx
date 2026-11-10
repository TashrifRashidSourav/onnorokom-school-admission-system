import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StudentIdProvider } from '../student/StudentIdProvider'

/**
 * Renders a component with what the app normally provides around it: a fresh query
 * cache (no retries, so failures show at once), the student ID and a router.
 */
export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const result = render(
    <QueryClientProvider client={queryClient}>
      <StudentIdProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </StudentIdProvider>
    </QueryClientProvider>,
  )
  return { ...result, queryClient }
}
