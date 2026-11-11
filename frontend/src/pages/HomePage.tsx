import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'
import { HowItWorks } from '../components/HowItWorks'
import { AdmissionRules } from '../school/AdmissionRules'
import { LiveSeatStats } from '../school/LiveSeatStats'
import { NoticeBoard } from '../school/NoticeBoard'
import { OpenClassesPreview } from '../school/OpenClassesPreview'
import { SchoolCrest } from '../school/SchoolCrest'
import { SectionHeading } from '../school/SectionHeading'
import { school } from '../school/schoolInfo'

function Hero() {
  return (
    <Box
      component="section"
      aria-labelledby="hero-title"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: { xs: 3, md: 4 },
        color: 'primary.contrastText',
        background: 'linear-gradient(135deg, #0A4F3A 0%, #0E6B4F 55%, #1C7D5E 100%)',
        px: { xs: 2.5, sm: 4, md: 6 },
        py: { xs: 3.5, md: 6 },
        display: 'grid',
        gap: { xs: 3, md: 5 },
        gridTemplateColumns: { xs: '1fr', md: '1.25fr 1fr' },
        alignItems: 'center',
      }}
    >
      {/* Large faded crest in the corner, purely decorative. */}
      <Box aria-hidden sx={{ position: 'absolute', right: -40, bottom: -60, opacity: 0.08, display: { xs: 'none', md: 'block' } }}>
        <SchoolCrest size={320} />
      </Box>

      <Box sx={{ position: 'relative' }}>
        <Typography
          variant="overline"
          sx={{
            display: 'inline-block',
            bgcolor: 'secondary.main',
            color: 'secondary.contrastText',
            px: 1.25,
            borderRadius: 1,
            lineHeight: 2,
            mb: 2,
          }}
        >
          Admission notice · ভর্তি বিজ্ঞপ্তি
        </Typography>
        <Typography id="hero-title" variant="h1" sx={{ fontSize: { xs: '1.85rem', sm: '2.25rem', md: '2.75rem' }, mb: 1 }}>
          Online admission for session {school.session}
        </Typography>
        <Typography sx={{ fontSize: { xs: '1.05rem', md: '1.2rem' }, fontWeight: 600, color: 'secondary.light', mb: 2 }}>
          {school.sessionBn} শিক্ষাবর্ষে অনলাইনে ভর্তি চলছে
        </Typography>
        <Typography sx={{ opacity: 0.92, maxWidth: 560, mb: 3 }}>
          Apply for the class and shift of your choice from home. Seats are given first come, first served, with no
          lottery. Applying holds a seat for the student; pay the admission fee in time to confirm it.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            component={RouterLink}
            to="/classes"
            variant="contained"
            color="secondary"
            size="large"
            endIcon={<ArrowForwardRoundedIcon />}
          >
            Apply now · আবেদন করুন
          </Button>
          <Button
            component={RouterLink}
            to="/my-applications"
            variant="outlined"
            size="large"
            startIcon={<AssignmentOutlinedIcon />}
            sx={{ color: 'inherit', borderColor: 'rgba(255, 255, 255, 0.5)', '&:hover': { borderColor: '#FFFFFF' } }}
          >
            My applications
          </Button>
        </Stack>
      </Box>

      <Box sx={{ position: 'relative' }}>
        <LiveSeatStats />
      </Box>
    </Box>
  )
}

function HelpStrip() {
  return (
    <Paper
      component="section"
      aria-label="Help"
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        alignItems: { md: 'center' },
        justifyContent: 'space-between',
        bgcolor: 'rgba(var(--mui-palette-secondary-mainChannel) / 0.08)',
        borderColor: 'rgba(var(--mui-palette-secondary-mainChannel) / 0.35)',
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <PhoneInTalkOutlinedIcon sx={{ color: 'secondary.dark', fontSize: 32 }} />
        <Box>
          <Typography sx={{ fontWeight: 700 }}>Need help with the application? · সাহায্য দরকার?</Typography>
          <Typography variant="body2" color="text.secondary">
            Call the admission office at {school.phone} ({school.officeHours}) or read the answers to common
            questions.
          </Typography>
        </Box>
      </Stack>
      <Button component={RouterLink} to="/help" variant="outlined" startIcon={<HelpOutlineRoundedIcon />} sx={{ flexShrink: 0 }}>
        Help and FAQ
      </Button>
    </Paper>
  )
}

/** The school's admission portal home: notice, live figures, how to apply, notices and rules. */
export function HomePage() {
  return (
    <Stack spacing={{ xs: 5, md: 7 }}>
      <Hero />

      <Box component="section" aria-labelledby="steps-title">
        <SectionHeading id="steps-title" title="How to apply" titleBn="কীভাবে আবেদন করবেন">
          Online admission takes a few minutes. No account or visit to the school is needed.
        </SectionHeading>
        <HowItWorks />
      </Box>

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr' }, alignItems: 'stretch' }}>
        <NoticeBoard />
        <OpenClassesPreview />
      </Box>

      <Box component="section" aria-labelledby="rules-title">
        <SectionHeading id="rules-title" title="Admission rules" titleBn="ভর্তির নিয়মাবলি">
          Please read these before applying. They apply to every class and shift.
        </SectionHeading>
        <AdmissionRules />
      </Box>

      <HelpStrip />
    </Stack>
  )
}
