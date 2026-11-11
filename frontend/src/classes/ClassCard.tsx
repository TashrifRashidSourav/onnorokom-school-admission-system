import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ClassSummary } from '../api/types'
import { ApplyButton } from './ApplyButton'
import { classNameParts } from './classNameParts'
import { ShiftChip } from './ShiftChip'
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

/** "Few seats left" once a tenth or fewer of the seats (at most 5) are free. */
function isAlmostFull(seats: ClassSummary): boolean {
  return seats.availableSeats > 0 && (seats.availableSeats <= 5 || seats.availableSeats / seats.totalSeats <= 0.1)
}

function AvailabilityChip({ seats }: { seats: ClassSummary }) {
  if (seats.availableSeats <= 0) return <Chip label="Full · আসন নেই" size="small" color="error" variant="outlined" />
  if (isAlmostFull(seats)) return <Chip label="Few seats left" size="small" color="warning" variant="outlined" />
  return <Chip label="Open" size="small" color="success" variant="outlined" />
}

/** One class and shift: free seats, how the seats are used, and Apply. */
export function ClassCard({ seats }: { seats: ClassSummary }) {
  const full = seats.availableSeats <= 0
  const { shift } = classNameParts(seats.name)

  return (
    <Paper
      component="article"
      aria-labelledby={`class-${seats.id}-name`}
      sx={{
        p: 2.5,
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: '100%',
        borderTop: '4px solid',
        borderTopColor: full ? 'grey.300' : 'primary.main',
        transition: 'box-shadow 0.15s',
        '&:hover': { boxShadow: '0 6px 18px rgba(16, 24, 40, 0.08)' },
      }}
    >
      <Box>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: shift ? 1 : 0 }}>
          <Typography id={`class-${seats.id}-name`} variant="h3" component="h3" sx={{ overflowWrap: 'anywhere' }}>
            {seats.name}
          </Typography>
          <AvailabilityChip seats={seats} />
        </Stack>
        {shift !== null && <ShiftChip shift={shift} />}
      </Box>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'baseline' }}>
        <Typography
          component="p"
          sx={{ fontSize: '2.25rem', fontWeight: 700, lineHeight: 1, color: full ? 'text.secondary' : 'primary.main' }}
          data-testid="available-seats"
        >
          {formatCount(Math.max(seats.availableSeats, 0))}
        </Typography>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.3 }}>
            of {formatCount(seats.totalSeats)} seats available
          </Typography>
          <Typography variant="caption" color="text.secondary">
            খালি আসন
          </Typography>
        </Box>
      </Stack>

      <SeatBar seats={seats} />

      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Legend color="success.main" label="Confirmed" value={seats.confirmedSeats} />
        <Legend color="warning.light" label="Held" value={seats.heldSeats} />
        <Legend color="grey.300" label="Free" value={Math.max(seats.availableSeats, 0)} />
      </Stack>

      <Box sx={{ mt: 'auto', pt: 1 }}>
        <ApplyButton seats={seats} />
      </Box>
    </Paper>
  )
}
