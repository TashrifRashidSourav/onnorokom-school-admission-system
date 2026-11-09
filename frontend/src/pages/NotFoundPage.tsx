import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'

interface NotFoundPageProps {
  /** Where "go back" leads: the home of the area (parent portal or admin console). */
  homePath?: string
  homeLabel?: string
}

export function NotFoundPage({ homePath = '/', homeLabel = 'Go to the class list' }: NotFoundPageProps) {
  return (
    <Box component="section">
      <Typography variant="h1" gutterBottom>
        Page not found
      </Typography>
      <Typography color="text.secondary">
        This page does not exist.{' '}
        <Link component={RouterLink} to={homePath}>
          {homeLabel}
        </Link>
        .
      </Typography>
    </Box>
  )
}
