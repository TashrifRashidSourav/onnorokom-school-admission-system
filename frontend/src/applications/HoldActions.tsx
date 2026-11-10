import { useMutation, useQueryClient } from '@tanstack/react-query'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ApiError } from '../api/client'
import { confirmHold } from '../api/endpoints'
import { queryKeys } from '../api/queryClient'
import type { HoldDetails, HoldStatus } from '../api/types'
import { useStudentId } from '../student/StudentIdContext'

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback

interface HoldActionsProps {
  hold: HoldDetails
}

/** Pay and cancel for one application; starts fresh whenever the student ID changes. */
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

  const noStudent = studentId === null

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button
          variant="contained"
          size="large"
          disabled={noStudent || pay.isPending}
          onClick={() => pay.mutate()}
          startIcon={pay.isPending ? <CircularProgress size={16} color="inherit" /> : <PaymentsRoundedIcon />}
        >
          {pay.isPending ? 'Paying…' : 'Pay admission fee'}
        </Button>
      </Stack>
      {noStudent && (
        <Typography variant="body2" color="text.secondary">
          Enter the student ID at the top of the page to pay or cancel.
        </Typography>
      )}
      {pay.isError && (
        <Alert severity="error" variant="outlined">
          {errorMessage(pay.error, 'The payment could not be sent. Please try again.')}
        </Alert>
      )}
    </Stack>
  )
}
