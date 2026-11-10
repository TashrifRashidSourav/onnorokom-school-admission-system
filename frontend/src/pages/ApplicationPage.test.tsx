import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { HoldStatus } from '../api/types'
import { renderWithProviders } from '../test/renderWithProviders'
import { ApplicationPage } from './ApplicationPage'

const STUDENT = '20152691234567890'
const HOLD_ID = 'h_test'
const CLASS_ID = 'c_test'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/**
 * A fake backend. The hold always comes back with the given status and expiry, even
 * after the expiry has passed, like a server whose answer is a moment behind.
 */
function fakeServer(hold: { status: HoldStatus; expiresAt: string }, confirm?: () => Response) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname
    if (path === `/holds/${HOLD_ID}/confirm` && init?.method === 'POST') {
      return confirm ? confirm() : json({ holdId: HOLD_ID, status: 'CONFIRMED' })
    }
    if (path === `/holds/${HOLD_ID}`) {
      return json({ holdId: HOLD_ID, classId: CLASS_ID, ...hold })
    }
    if (path === `/classes/${CLASS_ID}`) {
      return json({ id: CLASS_ID, name: 'Class 6 - Morning Shift', totalSeats: 120, heldSeats: 1, confirmedSeats: 0, availableSeats: 119 })
    }
    return json([])
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderApplication() {
  return renderWithProviders(
    <Routes>
      <Route path="/applications/:holdId" element={<ApplicationPage />} />
    </Routes>,
    { route: `/applications/${HOLD_ID}` },
  )
}

const secondsFromNow = (seconds: number) => new Date(Date.now() + seconds * 1_000).toISOString()
const payButton = () => screen.getByRole('button', { name: /pay admission fee|payment closed|fee paid|paying/i })

describe('application page countdown and payment', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    window.localStorage.setItem('admission.studentId', STUDENT)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('counts down while the seat is held, with Pay available', async () => {
    fakeServer({ status: 'HELD', expiresAt: secondsFromNow(90) })
    renderApplication()

    const timer = await screen.findByRole('timer')
    expect(timer).toHaveTextContent('1:30')
    expect(payButton()).toBeEnabled()
    expect(payButton()).toHaveTextContent('Pay admission fee · ভর্তি ফি দিন')
    expect(screen.getByRole('button', { name: /cancel application · বাতিল/i })).toBeEnabled()

    await act(() => vi.advanceTimersByTimeAsync(5_000))
    expect(screen.getByRole('timer')).toHaveTextContent('1:25')
  })

  it('turns Expired and disables Pay the moment the countdown reaches zero, without a reload', async () => {
    fakeServer({ status: 'HELD', expiresAt: secondsFromNow(3) })
    renderApplication()
    await screen.findByRole('timer')
    expect(payButton()).toBeEnabled()

    await act(() => vi.advanceTimersByTimeAsync(3_500))

    expect(screen.getByText('Expired')).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(payButton()).toBeDisabled()
    expect(payButton()).toHaveTextContent('Payment closed')
    expect(screen.queryByRole('button', { name: /cancel application/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Apply again' })).toBeInTheDocument()
  })

  it('keeps Pay disabled for an application that already expired', async () => {
    fakeServer({ status: 'EXPIRED', expiresAt: secondsFromNow(-60) })
    renderApplication()

    expect(await screen.findByText('Expired')).toBeInTheDocument()
    expect(payButton()).toBeDisabled()
  })

  it('shows Admission confirmed and disables Pay after paying', async () => {
    const server = fakeServer({ status: 'HELD', expiresAt: secondsFromNow(300) })
    renderApplication()
    await screen.findByRole('timer')

    await userEvent.click(payButton(), { advanceTimers: vi.advanceTimersByTime })

    expect(await screen.findByText('Admission confirmed')).toBeInTheDocument()
    expect(payButton()).toBeDisabled()
    expect(payButton()).toHaveTextContent('Fee paid')
    const confirmCall = server.mock.calls.find(([url]) => String(url).endsWith('/confirm'))
    expect(confirmCall).toBeDefined()
    const headers = confirmCall![1]!.headers as Record<string, string>
    expect(headers['X-Student-Id']).toBe(STUDENT)
  })

  it('explains in plain words when the server says time ran out while paying', async () => {
    fakeServer({ status: 'HELD', expiresAt: secondsFromNow(300) }, () =>
      json({ error: 'hold_expired', message: 'server wording' }, 409),
    )
    renderApplication()
    await screen.findByRole('timer')

    await userEvent.click(payButton(), { advanceTimers: vi.advanceTimersByTime })

    const alert = await screen.findByText(/time to pay for this application ran out/)
    expect(within(alert.closest('[role="alert"]') as HTMLElement).queryByText('server wording')).toBeNull()
  })
})
