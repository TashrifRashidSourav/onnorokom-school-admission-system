// Adds matchers such as toBeDisabled() and toHaveTextContent() to expect().
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Each test starts with an empty page and no saved student ID.
afterEach(() => {
  cleanup()
  window.localStorage.clear()
})
