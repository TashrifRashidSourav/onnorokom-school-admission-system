import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useClasses } from '../classes/useClasses'
import { seatTotals } from './seatTotals'

interface Stat {
  label: string
  labelBn: string
  value: number
}

/** Live admission figures for the hero banner: they follow the seat counts as they change. */
export function LiveSeatStats() {
  const { data: classes, isPending, isError } = useClasses()
  const totals = classes === undefined ? undefined : seatTotals(classes)

  const stats: Stat[] = totals
    ? [
        { label: 'Seats available', labelBn: 'খালি আসন', value: totals.availableSeats },
        { label: 'Classes & shifts open', labelBn: 'খোলা ক্লাস', value: totals.openClasses },
        { label: 'Total seats', labelBn: 'মোট আসন', value: totals.totalSeats },
        { label: 'Admissions confirmed', labelBn: 'নিশ্চিত ভর্তি', value: totals.confirmedSeats },
      ]
    : []

  return (
    <Box
      component="section"
      aria-label="Admission at a glance"
      sx={{
        borderRadius: 3,
        p: { xs: 2, sm: 2.5 },
        bgcolor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
        <Box
          aria-hidden
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: isError ? 'warning.light' : '#4ADE80',
            boxShadow: isError ? 'none' : '0 0 0 4px rgba(74, 222, 128, 0.25)',
          }}
        />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {isError ? 'Live figures unavailable right now' : 'Live admission figures'}
        </Typography>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
        {isPending
          ? [0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={72} sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)' }} />
            ))
          : stats.map((stat) => (
              <Box key={stat.label} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(0, 0, 0, 0.14)' }}>
                <Typography
                  data-testid={`stat-${stat.label}`}
                  sx={{ fontSize: { xs: '1.6rem', sm: '1.9rem' }, fontWeight: 700, lineHeight: 1.1 }}
                >
                  {stat.value.toLocaleString('en-US')}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.3 }}>
                  {stat.label}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                  {stat.labelBn}
                </Typography>
              </Box>
            ))}
      </Box>
    </Box>
  )
}
