import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

/** Parent home: what online admission is, then every class with its seats. */
export function ClassListPage() {
  return (
    <Box>
      <Box component="section" aria-labelledby="intro-title" sx={{ maxWidth: 720, mb: { xs: 4, md: 6 } }}>
        <Typography variant="overline" color="primary">
          Online admission
        </Typography>
        <Typography id="intro-title" variant="h1" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, mb: 1.5 }}>
          Apply for a seat in a few minutes
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: { md: '1.05rem' } }}>
          Seats are given first come, first served; there is no lottery. Applying holds a seat for the
          student for a limited time. Pay the admission fee before the time runs out to confirm the
          admission, or the seat goes to the next applicant.
        </Typography>
      </Box>

      <Box component="section" aria-labelledby="classes-title">
        <Typography id="classes-title" variant="h2" gutterBottom>
          Classes
        </Typography>
        <Typography color="text.secondary">
          Every class and shift with its total, held, confirmed and available seats.
        </Typography>
      </Box>
    </Box>
  )
}
