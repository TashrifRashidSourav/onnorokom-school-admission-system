import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { school } from './schoolInfo'

/** Thin band above the header: admission office contacts and the admission status. */
export function TopInfoBar() {
  return (
    <Box className="no-print" sx={{ bgcolor: 'primary.dark', color: 'primary.contrastText' }}>
      <Container maxWidth="lg">
        <Stack
          direction="row"
          spacing={3}
          sx={{ minHeight: 34, alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}
        >
          <Stack direction="row" spacing={2.5} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <PhoneInTalkOutlinedIcon sx={{ fontSize: 16, opacity: 0.85 }} />
              <span>Admission office: {school.phone}</span>
            </Stack>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <MailOutlineRoundedIcon sx={{ fontSize: 16, opacity: 0.85 }} />
              <span>{school.email}</span>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mx: { xs: 'auto', md: 0 } }}>
            <CampaignOutlinedIcon sx={{ fontSize: 17, color: 'secondary.light' }} />
            <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 600 }}>
              Online admission {school.session} is open
            </Typography>
            <Typography component="span" sx={{ fontSize: 'inherit', opacity: 0.85, display: { xs: 'none', sm: 'inline' } }}>
              · ভর্তি চলছে
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
