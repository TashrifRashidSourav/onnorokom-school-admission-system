import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'
import { useClasses } from '../classes/useClasses'

/** How many classes the home page lists; the rest are on the Classes page. */
const PREVIEW_COUNT = 5

/** A short, live list of classes with free seats, most seats first, linking to all classes. */
export function OpenClassesPreview() {
  const { data: classes, isPending, isError } = useClasses()
  const open = (classes ?? [])
    .filter((c) => c.availableSeats > 0)
    .sort((a, b) => b.availableSeats - a.availableSeats)
  const shown = open.slice(0, PREVIEW_COUNT)

  return (
    <Paper component="section" aria-labelledby="open-classes-title" sx={{ borderRadius: 3, p: 2.5, height: '100%' }}>
      <Typography id="open-classes-title" component="h2" sx={{ fontWeight: 700 }}>
        Seats open now
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        খালি আসন · updates every few seconds
      </Typography>

      {isPending && [0, 1, 2].map((i) => <Skeleton key={i} height={46} />)}
      {isError && (
        <Typography variant="body2" color="text.secondary">
          The seat counts could not be loaded right now. The Classes page shows the details.
        </Typography>
      )}
      {classes !== undefined && open.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {classes.length === 0
            ? 'No classes are open for admission yet. Please check back later.'
            : 'All seats are taken at the moment. A seat may open up if an application expires or is cancelled.'}
        </Typography>
      )}

      <Stack component="ul" spacing={1.75} sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {shown.map((c) => (
          <Box component="li" key={c.id}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                {c.name}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'nowrap', color: 'primary.main', fontWeight: 700 }}>
                {c.availableSeats} free
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={c.totalSeats === 0 ? 0 : (c.availableSeats / c.totalSeats) * 100}
              aria-label={`${c.name}: ${c.availableSeats} of ${c.totalSeats} seats free`}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        ))}
      </Stack>

      <Button component={RouterLink} to="/classes" endIcon={<ArrowForwardRoundedIcon />} sx={{ mt: 2, px: 0 }}>
        {open.length > PREVIEW_COUNT ? `All ${classes?.length ?? ''} classes and shifts` : 'See all classes and apply'}
      </Button>
    </Paper>
  )
}
