import type { ReactNode } from 'react'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import EventSeatOutlinedIcon from '@mui/icons-material/EventSeatOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

interface Step {
  icon: ReactNode
  title: string
  titleBn: string
  text: string
}

const steps: Step[] = [
  {
    icon: <BadgeOutlinedIcon />,
    title: 'Enter the student ID',
    titleBn: 'জন্ম নিবন্ধন নম্বর দিন',
    text: "The student's 17-digit birth registration number at the top of the page. No account needed.",
  },
  {
    icon: <EventSeatOutlinedIcon />,
    title: 'Apply for a class',
    titleBn: 'আবেদন করুন',
    text: 'Choose a class and shift with free seats. A seat is held for the student right away.',
  },
  {
    icon: <PaymentsOutlinedIcon />,
    title: 'Pay the admission fee',
    titleBn: 'ভর্তি ফি দিন',
    text: 'Pay before the countdown on the application page reaches zero, or the seat is released.',
  },
  {
    icon: <TaskAltRoundedIcon />,
    title: 'Admission confirmed',
    titleBn: 'ভর্তি নিশ্চিত',
    text: 'The seat belongs to the student. Every application is listed under My applications.',
  },
]

/** The steps of online admission, numbered, with a Bangla title for each. */
export function HowItWorks() {
  return (
    <Box
      component="ol"
      aria-label="How to apply"
      sx={{
        listStyle: 'none',
        p: 0,
        m: 0,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
        gap: 2,
      }}
    >
      {steps.map((step, index) => (
        <Paper component="li" key={step.title} sx={{ p: 2.5, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
          <Typography
            aria-hidden
            sx={{
              position: 'absolute',
              top: 4,
              right: 14,
              fontSize: '3.25rem',
              fontWeight: 800,
              lineHeight: 1,
              color: 'rgba(var(--mui-palette-primary-mainChannel) / 0.07)',
            }}
          >
            {index + 1}
          </Typography>
          <Box
            aria-hidden
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              color: 'primary.main',
              bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.08)',
              mb: 1.5,
            }}
          >
            {step.icon}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            Step {index + 1}
          </Typography>
          <Typography sx={{ fontWeight: 600 }}>{step.title}</Typography>
          <Typography variant="body2" sx={{ color: 'primary.dark', mb: 0.75 }}>
            {step.titleBn}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {step.text}
          </Typography>
        </Paper>
      ))}
    </Box>
  )
}
