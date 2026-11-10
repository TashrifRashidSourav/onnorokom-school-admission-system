import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'
import { SchoolCrest } from '../school/SchoolCrest'
import { school } from '../school/schoolInfo'

/** The school's crest and name (English and Bangla), linking to the given home page. */
export function BrandLogo({ to = '/', subtitle }: { to?: string; subtitle?: string }) {
  return (
    <Box
      component={RouterLink}
      to={to}
      aria-label={`${school.name}, home`}
      sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'text.primary', textDecoration: 'none', minWidth: 0 }}
    >
      <SchoolCrest size={38} />
      <Box sx={{ lineHeight: 1.15, minWidth: 0 }}>
        <Typography
          component="span"
          sx={{
            display: 'block',
            fontWeight: 700,
            fontSize: { xs: '0.95rem', sm: '1.075rem' },
            color: 'primary.dark',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
            {school.shortName}
          </Box>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            {school.name}
          </Box>
        </Typography>
        <Typography
          component="span"
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {subtitle ?? school.nameBn}
        </Typography>
      </Box>
    </Box>
  )
}
