import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/renderWithProviders'
import { CreateClassForm } from './CreateClassForm'

async function choose(label: string, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: label }))
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }))
}

describe('new class form', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fills in the class name from the Class and Shift pickers', async () => {
    renderWithProviders(<CreateClassForm onCreated={() => undefined} />)

    await choose('Class', 'Class 6')
    expect(screen.getByLabelText('Class name')).toHaveValue('')
    await choose('Shift', 'Morning')

    expect(screen.getByLabelText('Class name')).toHaveValue('Class 6 - Morning Shift')
  })

  it('sends the picked name and the seats to the API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'c_1', name: 'KG - Day Shift', totalSeats: 60 }), { status: 201 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const onCreated = vi.fn()
    renderWithProviders(<CreateClassForm onCreated={onCreated} />)

    await choose('Class', 'KG')
    await choose('Shift', 'Day')
    await userEvent.type(screen.getByLabelText('Number of seats'), '60')
    await userEvent.click(screen.getByRole('button', { name: 'Create class' }))

    await vi.waitFor(() => expect(onCreated).toHaveBeenCalled())
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({ name: 'KG - Day Shift', totalSeats: 60 })
  })
})
