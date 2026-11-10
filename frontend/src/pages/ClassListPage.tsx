import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { HowItWorks } from '../components/HowItWorks'

/** Parent home: what online admission is, then every class with its seats. */
export function ClassListPage() {
  return (
    <Box>
      <Box component="section" aria-labelledby="intro-title" sx={{ maxWidth: 720, mb: 3 }}>
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

      <Box sx={{ mb: { xs: 5, md: 7 } }}>
        <HowItWorks />
      </Box>

      <Box component="section" aria-labelledby="classes-title">
        <Typography id="classes-title" variant="h2" gutterBottom>
          Classes
        </Typography>
        <Typography color="text.secondary">
          Every class and shift with its total, held, confirmed and available seats.
        </Typography>

        {/* Shown until classes exist; the class cards replace it once the list is loaded. */}
        <Paper
          sx={{
            mt: 3,
            py: { xs: 5, md: 7 },
            px: 3,
            borderRadius: 3,
            borderStyle: 'dashed',
            textAlign: 'center',
          }}
        >
          <SchoolOutlinedIcon color="disabled" sx={{ fontSize: 44, mb: 1 }} />
          <Typography sx={{ fontWeight: 600 }}>No classes are open yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mt: 0.5 }}>
            Classes appear here as soon as the school opens them for admission. Please check back
            later.
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}
