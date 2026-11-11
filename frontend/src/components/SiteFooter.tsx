import type { ReactNode } from 'react'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'
import { SchoolCrest } from '../school/SchoolCrest'
import { school } from '../school/schoolInfo'

export interface FooterLink {
  to: string
  label: string
}

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Typography
        component="h2"
        sx={{ fontWeight: 700, fontSize: '0.8125rem', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.5, color: 'secondary.light' }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  )
}

function ContactLine({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', mb: 1 }}>
      <Box sx={{ opacity: 0.75, display: 'flex', pt: '2px' }}>{icon}</Box>
      <Typography variant="body2" sx={{ opacity: 0.9, overflowWrap: 'anywhere' }}>
        {children}
      </Typography>
    </Stack>
  )
}

/**
 * The school's footer: who the school is, quick links, how to reach the admission
 * office, and (small, at the bottom) the way into the admin console.
 */
export function SiteFooter({ links = [] }: { links?: FooterLink[] }) {
  const linkSx = { color: 'inherit', opacity: 0.9, '&:hover': { opacity: 1 } }

  return (
    <Box component="footer" sx={{ bgcolor: '#0B2E24', color: '#FFFFFF', mt: 2 }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            py: { xs: 4, md: 6 },
            display: 'grid',
            gap: { xs: 3.5, md: 4 },
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.4fr 1fr 1.3fr 1.1fr' },
          }}
        >
          <Box>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
              <SchoolCrest size={40} />
              <Box>
                <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>{school.name}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {school.nameBn}
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.85, mb: 1 }}>
              {school.motto}
              <br />
              {school.mottoBn}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Established {school.established}
            </Typography>
          </Box>

          {links.length > 0 && (
            <Column title="Quick links">
              <Stack component="nav" aria-label="Footer" spacing={1}>
                {links.map((link) => (
                  <Link key={link.to} component={RouterLink} to={link.to} underline="hover" variant="body2" sx={linkSx}>
                    {link.label}
                  </Link>
                ))}
              </Stack>
            </Column>
          )}

          <Column title="Admission office">
            <ContactLine icon={<PlaceOutlinedIcon sx={{ fontSize: 18 }} />}>{school.address}</ContactLine>
            <ContactLine icon={<PhoneInTalkOutlinedIcon sx={{ fontSize: 18 }} />}>{school.phone}</ContactLine>
            <ContactLine icon={<MailOutlineRoundedIcon sx={{ fontSize: 18 }} />}>{school.email}</ContactLine>
            <ContactLine icon={<AccessTimeRoundedIcon sx={{ fontSize: 18 }} />}>{school.officeHours}</ContactLine>
          </Column>

          <Column title={`Admission ${school.session}`}>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
              Seats are given first come, first served. There is no lottery.
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              আগে আবেদন করলে আগে আসন। লটারি নেই।
            </Typography>
          </Column>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{
            py: 2.5,
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            justifyContent: 'space-between',
            alignItems: { sm: 'center' },
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            © {school.session} {school.name}. A fictional school for this demo.
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            School staff?{' '}
            <Link component={RouterLink} to="/admin" underline="hover" sx={{ color: 'secondary.light', fontWeight: 600 }}>
              Open the admin console
            </Link>
          </Typography>
        </Stack>
      </Container>
    </Box>
  )
}
