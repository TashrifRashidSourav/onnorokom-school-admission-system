import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Toolbar from '@mui/material/Toolbar'
import { Link as RouterLink, Outlet } from 'react-router'
import { BrandLogo } from '../components/BrandLogo'

/**
 * Layout of the school admin console. Separate from the parent portal: its own
 * header, no student ID box (admin actions do not act for a student).
 * The brief requires no login, so the console is open; see ASSUMPTIONS.md.
 */
export function AdminLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky">
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 2, minHeight: { xs: 64 } }}>
            <BrandLogo to="/admin" subtitle="School staff" />
            <Chip label="Admin console" size="small" color="primary" variant="outlined" />
            <Box sx={{ flex: 1 }} />
            <Button
              component={RouterLink}
              to="/"
              color="inherit"
              startIcon={<ArrowBackRoundedIcon />}
              sx={{ color: 'text.secondary' }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                View parent site
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                Parent site
              </Box>
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>
        <Outlet />
      </Container>
    </Box>
  )
}
