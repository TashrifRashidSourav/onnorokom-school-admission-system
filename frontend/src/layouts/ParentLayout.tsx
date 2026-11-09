import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import { NavLink, Outlet } from 'react-router'
import { config } from '../config'
import { BrandLogo } from '../components/BrandLogo'
import { StudentIdHeaderButton, StudentIdPrompt } from '../student/StudentIdBar'

/** Pages for parents applying on behalf of a student. No admin actions here. */
const parentNavItems = [
  { to: '/', label: 'Classes', end: true },
  { to: '/my-applications', label: 'My applications', end: false },
]

/** Layout of the parent portal: app bar with logo and parent navigation. */
export function ParentLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky">
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 3, minHeight: { xs: 64 } }}>
            <BrandLogo />
            <Stack component="nav" aria-label="Main" direction="row" spacing={0.5}>
              {parentNavItems.map((item) => (
                <Button
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  end={item.end}
                  color="inherit"
                  sx={{
                    color: 'text.secondary',
                    '&.active': { color: 'primary.main', bgcolor: 'rgba(29, 78, 216, 0.08)' },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
            <Box sx={{ flex: 1 }} />
            <StudentIdHeaderButton />
          </Toolbar>
        </Container>
      </AppBar>

      <StudentIdPrompt />

      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>
        <Outlet />
      </Container>

      <footer className="app-footer">
        API: <code>{config.apiUrl}</code>
      </footer>
    </Box>
  )
}
