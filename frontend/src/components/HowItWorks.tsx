import type { ReactNode } from 'react'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import EventSeatOutlinedIcon from '@mui/icons-material/EventSeatOutlined'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

interface Step {
  icon: ReactNode
  title: string
  text: string
}

const steps: Step[] = [
  {
    icon: <BadgeOutlinedIcon />,
    title: 'Enter the student ID',
    text: "The student's 17-digit birth registration number. No account needed.",
  },
  {
    icon: <EventSeatOutlinedIcon />,
    title: 'Apply for a class',
    text: 'Choose a class and shift. A seat is held for the student right away.',
  },
  {
    icon: <TaskAltRoundedIcon />,
    title: 'Pay the fee in time',
    text: 'Paying before the hold expires confirms the admission.',
  },
]

/** The three steps of admission, shown on the parent home page. */
export function HowItWorks() {
  return (
    <Box
      component="ol"
      aria-label="How admission works"
      sx={{
        listStyle: 'none',
        p: 0,
        m: 0,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
        gap: 2,
      }}
    >
      {steps.map((step, index) => (
        <Paper component="li" key={step.title} sx={{ p: 2.5, borderRadius: 3, display: 'flex', gap: 2 }}>
          <Box
            aria-hidden
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              color: 'primary.main',
              bgcolor: 'rgba(29, 78, 216, 0.08)',
            }}
          >
            {step.icon}
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Step {index + 1}
            </Typography>
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{step.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {step.text}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  )
}
