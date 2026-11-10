import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ClassSummary } from '../api/types'
import { SeatBar } from './SeatBar'

const formatCount = (value: number) => value.toLocaleString('en-US')

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
      <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
      <Typography variant="body2" color="text.secondary">
        {label} <Box component="strong" sx={{ color: 'text.primary' }}>{formatCount(value)}</Box>
      </Typography>
    </Stack>
  )
}

/** One class on the parent home page: name, free seats and how the seats are used. */
export function ClassCard({ seats }: { seats: ClassSummary }) {
  const full = seats.availableSeats <= 0

  return (
    <Paper
      component="article"
      aria-labelledby={`class-${seats.id}-name`}
      sx={{ p: 2.5, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}
    >
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography id={`class-${seats.id}-name`} variant="h3" component="h3" sx={{ overflowWrap: 'anywhere' }}>
          {seats.name}
        </Typography>
        {full && <Chip label="Full" size="small" color="error" variant="outlined" />}
      </Stack>

      <Box>
        <Typography
          component="p"
          sx={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.1, color: full ? 'text.secondary' : 'primary.main' }}
          data-testid="available-seats"
        >
          {formatCount(Math.max(seats.availableSeats, 0))}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          of {formatCount(seats.totalSeats)} seats available
        </Typography>
      </Box>

      <SeatBar seats={seats} />

      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', mt: 'auto' }}>
        <Legend color="success.main" label="Confirmed" value={seats.confirmedSeats} />
        <Legend color="warning.light" label="Held" value={seats.heldSeats} />
      </Stack>
    </Paper>
  )
}
