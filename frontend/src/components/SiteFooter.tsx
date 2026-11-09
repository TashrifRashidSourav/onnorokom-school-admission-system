import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'

/** Parent portal footer; the only way from the parent site to the admin console. */
export function SiteFooter() {
  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ py: 3, justifyContent: 'space-between', alignItems: { sm: 'center' } }}
        >
          <Typography variant="body2" color="text.secondary">
            School Admission · Seats are given first come, first served.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            School staff?{' '}
            <Link component={RouterLink} to="/admin/classes/new" underline="hover" sx={{ fontWeight: 600 }}>
              Open the admin console
            </Link>
          </Typography>
        </Stack>
      </Container>
    </Box>
  )
}
