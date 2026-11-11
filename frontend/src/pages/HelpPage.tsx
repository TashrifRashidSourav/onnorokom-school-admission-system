import type { ReactNode } from 'react'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { AdmissionRules } from '../school/AdmissionRules'
import { faqs } from '../school/admissionContent'
import { SectionHeading } from '../school/SectionHeading'
import { school } from '../school/schoolInfo'

function ContactRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Box sx={{ color: 'primary.main', display: 'flex', pt: '2px' }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{children}</Typography>
      </Box>
    </Stack>
  )
}

/** Answers to common questions, the admission rules and how to reach the admission office. */
export function HelpPage() {
  return (
    <Stack spacing={{ xs: 5, md: 6 }}>
      <SectionHeading level="h1" title="Help and frequently asked questions" titleBn="সাহায্য ও সাধারণ প্রশ্ন">
        Everything parents usually ask about online admission. Still stuck? The admission office is happy to help.
      </SectionHeading>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1.6fr 1fr' }, alignItems: 'start' }}>
        <Box component="section" aria-label="Frequently asked questions">
          {faqs.map((faq) => (
            <Accordion key={faq.question} disableGutters sx={{ '&:not(:last-of-type)': { borderBottom: 0 } }}>
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Typography sx={{ fontWeight: 600 }}>{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Paper component="section" aria-labelledby="office-title" sx={{ p: 3, borderRadius: 3 }}>
          <Typography id="office-title" component="h2" variant="h3">
            Admission office
          </Typography>
          <Typography variant="body2" sx={{ color: 'secondary.dark', mb: 2.5 }}>
            ভর্তি অফিস · {school.name}
          </Typography>
          <Stack spacing={2}>
            <ContactRow icon={<PhoneInTalkOutlinedIcon />} label="Phone">
              {school.phone}
            </ContactRow>
            <ContactRow icon={<MailOutlineRoundedIcon />} label="Email">
              {school.email}
            </ContactRow>
            <ContactRow icon={<AccessTimeRoundedIcon />} label="Office hours">
              {school.officeHours}
            </ContactRow>
            <ContactRow icon={<PlaceOutlinedIcon />} label="Address">
              {school.address}
            </ContactRow>
          </Stack>
        </Paper>
      </Box>

      <Box component="section" aria-labelledby="help-rules-title">
        <SectionHeading id="help-rules-title" title="Admission rules" titleBn="ভর্তির নিয়মাবলি" />
        <AdmissionRules />
      </Box>
    </Stack>
  )
}
