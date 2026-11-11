import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { notices } from './admissionContent'

const dayOf = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit' })
const monthOf = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { month: 'short' })
const fullDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

/** The admission notices, newest first, like the notice board on a school's website. */
export function NoticeBoard() {
  return (
    <Paper component="section" aria-labelledby="notices-title" sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ px: 2.5, py: 1.75, bgcolor: 'primary.main', color: 'primary.contrastText', alignItems: 'center' }}
      >
        <CampaignOutlinedIcon fontSize="small" />
        <Typography id="notices-title" component="h2" sx={{ fontWeight: 700 }}>
          Notice board
        </Typography>
        <Typography component="span" sx={{ opacity: 0.85 }}>
          · নোটিশ বোর্ড
        </Typography>
      </Stack>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {notices.map((notice) => (
          <Stack
            component="li"
            key={notice.title}
            direction="row"
            spacing={2}
            sx={{ px: 2.5, py: 2, borderTop: 1, borderColor: 'divider', '&:first-of-type': { borderTop: 0 } }}
          >
            <Box
              component="time"
              dateTime={notice.date}
              aria-label={fullDate(notice.date)}
              sx={{
                width: 52,
                flexShrink: 0,
                textAlign: 'center',
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                overflow: 'hidden',
                alignSelf: 'flex-start',
              }}
            >
              <Box sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText', fontSize: '0.7rem', fontWeight: 700, py: 0.25 }}>
                {monthOf(notice.date).toUpperCase()}
              </Box>
              <Box sx={{ fontWeight: 700, fontSize: '1.15rem', py: 0.5 }}>{dayOf(notice.date)}</Box>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.25 }}>
                <Typography sx={{ fontWeight: 600, lineHeight: 1.35 }}>{notice.title}</Typography>
                {notice.important === true && <Chip label="New" size="small" color="secondary" />}
              </Stack>
              {notice.titleBn !== undefined && (
                <Typography variant="body2" sx={{ color: 'primary.dark', mb: 0.5 }}>
                  {notice.titleBn}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                {notice.text}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Box>
    </Paper>
  )
}
