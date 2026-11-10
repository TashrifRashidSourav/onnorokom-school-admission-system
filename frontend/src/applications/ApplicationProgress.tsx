import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import Typography from '@mui/material/Typography'
import type { HoldStatus } from '../api/types'

interface ProgressStep {
  label: string
  labelBn: string
}

const steps: ProgressStep[] = [
  { label: 'Applied', labelBn: 'আবেদন' },
  { label: 'Seat held', labelBn: 'আসন সংরক্ষিত' },
  { label: 'Fee paid', labelBn: 'ফি জমা' },
  { label: 'Admitted', labelBn: 'ভর্তি নিশ্চিত' },
]

/** Where the application ended, when it did not reach admission. */
const endings: Partial<Record<HoldStatus, string>> = {
  EXPIRED: 'Time ran out',
  CANCELLED: 'Cancelled',
}

/**
 * The application's progress from applying to admission. An expired or cancelled
 * application stops at "Fee paid", marked as an error with the reason.
 */
export function ApplicationProgress({ status }: { status: HoldStatus }) {
  const activeStep = status === 'CONFIRMED' ? steps.length : 2
  const ending = endings[status]

  return (
    <Stepper activeStep={activeStep} alternativeLabel aria-label="Application progress">
      {steps.map((step, index) => {
        const failed = ending !== undefined && index === 2
        return (
          <Step key={step.label} completed={index < activeStep && !failed}>
            <StepLabel
              error={failed}
              optional={
                <Typography variant="caption" color={failed ? 'error' : 'text.secondary'} sx={{ display: 'block' }}>
                  {failed ? ending : step.labelBn}
                </Typography>
              }
            >
              {step.label}
            </StepLabel>
          </Step>
        )
      })}
    </Stepper>
  )
}
