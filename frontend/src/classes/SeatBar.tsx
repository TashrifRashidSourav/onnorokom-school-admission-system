import Box from '@mui/material/Box'
import type { ClassSummary } from '../api/types'

const percent = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0)

/**
 * Horizontal bar of a class's seats: confirmed (green), held (amber), the rest free.
 * Screen readers get the same numbers as text.
 */
export function SeatBar({ seats }: { seats: ClassSummary }) {
  const taken = seats.confirmedSeats + seats.heldSeats
  return (
    <Box
      role="img"
      aria-label={`${taken} of ${seats.totalSeats} seats taken: ${seats.confirmedSeats} confirmed, ${seats.heldSeats} held`}
      sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', bgcolor: 'grey.200' }}
    >
      <Box sx={{ width: `${percent(seats.confirmedSeats, seats.totalSeats)}%`, bgcolor: 'success.main' }} />
      <Box sx={{ width: `${percent(seats.heldSeats, seats.totalSeats)}%`, bgcolor: 'warning.light' }} />
    </Box>
  )
}
