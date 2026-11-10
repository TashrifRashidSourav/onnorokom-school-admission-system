import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'
import { ApiError } from '../api/client'
import { describeError } from '../api/errorMessages'
import { cancelHold, confirmHold } from '../api/endpoints'
import { queryKeys } from '../api/queryClient'
import type { HoldDetails, HoldStatus } from '../api/types'
import { useStudentId } from '../student/StudentIdContext'


interface HoldActionsProps {
  hold: HoldDetails
}

/**
 * Pay and cancel for one application; starts fresh whenever the student ID changes.
 * `hold.status` is the live status, so the moment the countdown reaches zero both
 * actions are switched off.
 */
export function HoldActions({ hold }: HoldActionsProps) {
  const { studentId } = useStudentId()
  return <ActionsForStudent key={studentId ?? 'none'} hold={hold} studentId={studentId} />
}

/**
 * After a pay or cancel: show the new status at once, then reload the seat counts and
 * the student's list. A 409 means the hold changed elsewhere (expired, cancelled in
 * another tab), so the hold itself is reloaded to show what really happened.
 */
function useAfterChange(holdId: string) {
  const queryClient = useQueryClient()
  return {
    succeeded: (status: HoldStatus) => {
      queryClient.setQueryData<HoldDetails>(queryKeys.hold(holdId), (old) => old && { ...old, status })
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes })
      void queryClient.invalidateQueries({ queryKey: queryKeys.myHolds })
    },
    failed: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.hold(holdId) })
        void queryClient.invalidateQueries({ queryKey: queryKeys.classes })
      }
    },
  }
}

function ActionsForStudent({ hold, studentId }: HoldActionsProps & { studentId: string | null }) {
  const after = useAfterChange(hold.holdId)
  const pay = useMutation({
    mutationFn: () => confirmHold(hold.holdId),
    onSuccess: (confirmed) => after.succeeded(confirmed.status),
    onError: after.failed,
  })
  const [asking, setAsking] = useState(false)
  const cancel = useMutation({
    mutationFn: () => cancelHold(hold.holdId),
    onSuccess: () => after.succeeded('CANCELLED'),
    onError: after.failed,
    onSettled: () => setAsking(false),
  })

  const noStudent = studentId === null
  const held = hold.status === 'HELD'
  const busy = pay.isPending || cancel.isPending

  let payLabel = 'Pay admission fee'
  if (pay.isPending) payLabel = 'Paying…'
  else if (hold.status === 'CONFIRMED') payLabel = 'Fee paid'
  else if (!held) payLabel = 'Payment closed'

  let payIcon = <PaymentsRoundedIcon />
  if (pay.isPending) payIcon = <CircularProgress size={16} color="inherit" />
  else if (hold.status === 'CONFIRMED') payIcon = <CheckCircleRoundedIcon />

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button
          variant="contained"
          size="large"
          disabled={noStudent || !held || busy}
          onClick={() => pay.mutate()}
          startIcon={payIcon}
        >
          {payLabel}
        </Button>
        {/* A paid admission cannot be cancelled here (no refunds); ended ones have nothing to cancel. */}
        {held && (
          <Button
            variant="outlined"
            color="error"
            size="large"
            disabled={noStudent || busy}
            onClick={() => setAsking(true)}
          >
            Cancel application
          </Button>
        )}
        {(hold.status === 'EXPIRED' || hold.status === 'CANCELLED') && (
          <Button component={RouterLink} to="/classes" variant="outlined" size="large">
            Apply again
          </Button>
        )}
      </Stack>
      {noStudent && held && (
        <Typography variant="body2" color="text.secondary">
          Enter the student ID at the top of the page to pay or cancel.
        </Typography>
      )}
      {pay.isError && (
        <Alert severity="error" variant="outlined">
          {describeError(pay.error, 'The payment could not be sent. Please try again.')}
        </Alert>
      )}
      {cancel.isError && (
        <Alert severity="error" variant="outlined">
          {describeError(cancel.error, 'The application could not be cancelled. Please try again.')}
        </Alert>
      )}

      <Dialog
        open={asking && held}
        onClose={() => !cancel.isPending && setAsking(false)}
        aria-labelledby="cancel-title"
        aria-describedby="cancel-text"
      >
        <DialogTitle id="cancel-title">Cancel this application?</DialogTitle>
        <DialogContent>
          <DialogContentText id="cancel-text">
            The held seat is released at once and may be taken by another student. You can apply
            again later only if a seat is still free.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAsking(false)} disabled={cancel.isPending} color="inherit">
            Keep application
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => cancel.mutate()}
            disabled={cancel.isPending}
            startIcon={cancel.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {cancel.isPending ? 'Cancelling…' : 'Yes, cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
