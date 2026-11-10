import { describe, expect, it } from 'vitest'
import { formatRemaining } from './formatRemaining'

describe('formatRemaining', () => {
  it.each([
    [600_000, '10:00'],
    [61_000, '1:01'],
    [59_000, '0:59'],
    [3_723_000, '1:02:03'],
  ])('shows %i ms as %s', (ms, text) => {
    expect(formatRemaining(ms)).toBe(text)
  })

  it('rounds a partial second up, so 0:00 only shows when time is really up', () => {
    expect(formatRemaining(400)).toBe('0:01')
  })

  it('never shows negative time', () => {
    expect(formatRemaining(-5_000)).toBe('0:00')
  })
})
