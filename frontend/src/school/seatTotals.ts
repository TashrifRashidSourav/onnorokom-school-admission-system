import type { ClassSummary } from '../api/types'

export interface SeatTotals {
  classes: number
  openClasses: number
  totalSeats: number
  heldSeats: number
  confirmedSeats: number
  availableSeats: number
}

/** Adds up the seats of every class, for the summaries on the home and admin pages. */
export function seatTotals(classes: ClassSummary[]): SeatTotals {
  return classes.reduce<SeatTotals>(
    (sum, c) => ({
      classes: sum.classes + 1,
      openClasses: sum.openClasses + (c.availableSeats > 0 ? 1 : 0),
      totalSeats: sum.totalSeats + c.totalSeats,
      heldSeats: sum.heldSeats + c.heldSeats,
      confirmedSeats: sum.confirmedSeats + c.confirmedSeats,
      availableSeats: sum.availableSeats + c.availableSeats,
    }),
    { classes: 0, openClasses: 0, totalSeats: 0, heldSeats: 0, confirmedSeats: 0, availableSeats: 0 },
  )
}
