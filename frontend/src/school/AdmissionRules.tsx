import type { ReactNode } from 'react'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import EventRepeatOutlinedIcon from '@mui/icons-material/EventRepeatOutlined'
import FormatListNumberedRoundedIcon from '@mui/icons-material/FormatListNumberedRounded'
import LooksOneOutlinedIcon from '@mui/icons-material/LooksOneOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import WbTwilightOutlinedIcon from '@mui/icons-material/WbTwilightOutlined'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { admissionRules } from './admissionContent'

// One icon per rule, in the order of admissionRules.
const icons: ReactNode[] = [
  <FormatListNumberedRoundedIcon key="order" />,
  <LooksOneOutlinedIcon key="one" />,
  <PaymentsOutlinedIcon key="pay" />,
  <EventRepeatOutlinedIcon key="release" />,
  <WbTwilightOutlinedIcon key="shift" />,
  <BlockOutlinedIcon key="final" />,
]

/** The admission rules as a grid of short cards, each in English with a Bangla title. */
export function AdmissionRules() {
  return (
    <Box
      component="ul"
      sx={{
        listStyle: 'none',
        p: 0,
        m: 0,
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
      }}
    >
      {admissionRules.map((rule, index) => (
        <Paper component="li" key={rule.title} sx={{ p: 2.5, borderRadius: 3 }}>
          <Box
            aria-hidden
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              mb: 1.5,
              color: 'secondary.dark',
              bgcolor: 'rgba(var(--mui-palette-secondary-mainChannel) / 0.14)',
            }}
          >
            {icons[index]}
          </Box>
          <Typography component="h3" sx={{ fontWeight: 600 }}>
            {rule.title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'primary.dark', mb: 0.75 }}>
            {rule.titleBn}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {rule.text}
          </Typography>
        </Paper>
      ))}
    </Box>
  )
}
