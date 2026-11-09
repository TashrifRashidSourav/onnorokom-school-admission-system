import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'

/** App logo: icon tile plus name, linking to the given home page. */
export function BrandLogo({ to = '/', subtitle }: { to?: string; subtitle?: string }) {
  return (
    <Box
      component={RouterLink}
      to={to}
      sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'text.primary', textDecoration: 'none' }}
    >
      <Box
        aria-hidden
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <SchoolRoundedIcon fontSize="small" />
      </Box>
      <Box sx={{ lineHeight: 1.15 }}>
        <Typography component="span" sx={{ display: 'block', fontWeight: 700, fontSize: '1.05rem' }}>
          School Admission
        </Typography>
        {subtitle !== undefined && (
          <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  )
}
