import { useState } from 'react'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import { NavLink, Outlet } from 'react-router'
import { BrandLogo } from '../components/BrandLogo'
import { SiteFooter } from '../components/SiteFooter'
import { StudentIdHeaderButton, StudentIdPrompt } from '../student/StudentIdBar'

/** Pages for parents applying on behalf of a student. No admin actions here. */
const parentNavItems = [
  { to: '/', label: 'Classes', end: true },
  { to: '/my-applications', label: 'My applications', end: false },
]

const activeBackground = 'rgba(29, 78, 216, 0.08)'

/** Layout of the parent portal: app bar with logo and parent navigation. */
export function ParentLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky">
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: { xs: 1, md: 3 }, minHeight: { xs: 64 } }}>
            <IconButton
              edge="start"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            >
              <MenuRoundedIcon />
            </IconButton>

            <BrandLogo />

            <Stack
              component="nav"
              aria-label="Main"
              direction="row"
              spacing={0.5}
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              {parentNavItems.map((item) => (
                <Button
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  end={item.end}
                  color="inherit"
                  sx={{
                    color: 'text.secondary',
                    '&.active': { color: 'primary.main', bgcolor: activeBackground },
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

      {/* Phone navigation: the same links in a drawer. */}
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)}>
        <Box sx={{ width: 280, p: 2 }} role="presentation">
          <Box sx={{ px: 1, pb: 2 }}>
            <BrandLogo />
          </Box>
          <List component="nav" aria-label="Main">
            {parentNavItems.map((item) => (
              <ListItemButton
                key={item.to}
                component={NavLink}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.active': { color: 'primary.main', bgcolor: activeBackground },
                }}
              >
                <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <StudentIdPrompt />

      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>
        <Outlet />
      </Container>

      <SiteFooter />
    </Box>
  )
}
