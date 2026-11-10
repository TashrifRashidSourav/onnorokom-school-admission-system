import { describe, expect, it } from 'vitest'
import { seatTotals } from './seatTotals'

describe('seatTotals', () => {
  it('adds up the seats of every class and counts the ones still open', () => {
    const totals = seatTotals([
      { id: 'a', name: 'A', totalSeats: 40, heldSeats: 5, confirmedSeats: 10, availableSeats: 25 },
      { id: 'b', name: 'B', totalSeats: 3, heldSeats: 1, confirmedSeats: 2, availableSeats: 0 },
    ])
    expect(totals).toEqual({
      classes: 2,
      openClasses: 1,
      totalSeats: 43,
      heldSeats: 6,
      confirmedSeats: 12,
      availableSeats: 25,
    })
  })

  it('is all zero without classes', () => {
    expect(seatTotals([]).totalSeats).toBe(0)
  })
})
