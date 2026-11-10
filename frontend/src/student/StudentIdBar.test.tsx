import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { request, STUDENT_ID_HEADER } from '../api/client'
import { renderWithProviders } from '../test/renderWithProviders'
import { StudentIdHeaderButton, StudentIdPrompt } from './StudentIdBar'

const VALID_ID = '20152691234567890'

function renderBar() {
  return renderWithProviders(
    <>
      <StudentIdHeaderButton />
      <StudentIdPrompt />
    </>,
  )
}

const input = () => screen.getByLabelText('Student birth registration number')
const submit = () => screen.getByRole('button', { name: 'Use this ID' })

describe('student ID entry', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('counts the digits while typing', async () => {
    renderBar()
    await userEvent.type(input(), '2015')
    expect(screen.getByText('4/17 digits')).toBeInTheDocument()
  })

  it.each([
    ['too short', '123', 3],
    ['too long', '201526912345678901', 18],
    ['not only digits', '2015269123456789X', 17],
  ])('rejects an ID that is %s with a message and saves nothing', async (_case, typed, count) => {
    renderBar()
    await userEvent.type(input(), typed)
    await userEvent.click(submit())

    expect(screen.getByRole('alert')).toHaveTextContent(
      `Enter the 17-digit birth registration number, digits only (you entered ${count}).`,
    )
    expect(input()).toHaveAttribute('aria-invalid', 'true')
    expect(window.localStorage.getItem('admission.studentId')).toBeNull()
  })

  it('clears the message as soon as the ID is edited', async () => {
    renderBar()
    await userEvent.type(input(), '123')
    await userEvent.click(submit())
    await userEvent.type(input(), '4')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('accepts 17 digits (spaces around are ignored), remembers them and shows them in the header', async () => {
    renderBar()
    await userEvent.type(input(), `  ${VALID_ID} `)
    await userEvent.click(submit())

    expect(screen.queryByLabelText('Student birth registration number')).not.toBeInTheDocument()
    expect(screen.getByTestId('current-student-id')).toHaveTextContent(VALID_ID)
    expect(window.localStorage.getItem('admission.studentId')).toBe(VALID_ID)
  })

  it('sends the entered ID with every API request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('[]', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    renderBar()
    await userEvent.type(input(), VALID_ID)
    await userEvent.click(submit())

    await request('/me/holds')

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers[STUDENT_ID_HEADER]).toBe(VALID_ID)
  })

  it('starts with a saved ID after a reload, so nothing has to be typed again', () => {
    window.localStorage.setItem('admission.studentId', VALID_ID)
    renderBar()
    expect(screen.queryByLabelText('Student birth registration number')).not.toBeInTheDocument()
    expect(screen.getByTestId('current-student-id')).toHaveTextContent(VALID_ID)
  })
})
