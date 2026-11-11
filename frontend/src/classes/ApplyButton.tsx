import { useMutation, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router'
import { describeError } from '../api/errorMessages'
import { applyForSeat } from '../api/endpoints'
import { queryKeys } from '../api/queryClient'
import type { ClassSummary, HoldDetails } from '../api/types'
import { useStudentId } from '../student/StudentIdContext'

const errorMessage = (error: unknown) =>
  describeError(error, 'The application could not be sent. Please try again.')

interface ApplyButtonProps {
  seats: ClassSummary
}

/** "Apply for a seat" on a class card; starts fresh whenever the student ID changes. */
export function ApplyButton({ seats }: ApplyButtonProps) {
  const { studentId } = useStudentId()
  return <ApplyForStudent key={studentId ?? 'none'} seats={seats} studentId={studentId} />
}

function ApplyForStudent({ seats, studentId }: ApplyButtonProps & { studentId: string | null }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const apply = useMutation({
    mutationFn: () => applyForSeat(seats.id),
    onSuccess: (hold) => {
      // The application page can show the new hold at once, without loading it again.
      const details: HoldDetails = {
        holdId: hold.holdId,
        classId: hold.classId,
        status: hold.status,
        expiresAt: hold.expiresAt,
      }
      queryClient.setQueryData(queryKeys.hold(hold.holdId), details)
      void navigate(`/applications/${encodeURIComponent(hold.holdId)}`)
    },
    // Seat counts change whether the application succeeded or the class turned out full;
    // a new application also belongs at the top of My applications.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.classes }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myHolds }),
      ]),
  })

  const full = seats.availableSeats <= 0
  const noStudent = studentId === null
  const disabled = noStudent || full || apply.isPending || apply.isSuccess

  let label = 'Apply · আবেদন করুন'
  if (apply.isPending) label = 'Applying…'
  else if (full && !apply.isSuccess) label = 'Class is full · আসন নেই'

  let hint: string | null = null
  if (noStudent) hint = 'Enter the student ID at the top of the page to apply.'
  else if (full && !apply.isSuccess && !apply.isError) hint = 'A seat may open up if an application expires or is cancelled.'

  return (
    <Stack spacing={1}>
      <Button
        variant="contained"
        fullWidth
        disabled={disabled}
        onClick={() => apply.mutate()}
        startIcon={apply.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {label}
      </Button>
      {hint !== null && (
        <Typography variant="body2" color="text.secondary">
          {hint}
        </Typography>
      )}
      {apply.isError && (
        <Alert severity="error" variant="outlined">
          {errorMessage(apply.error)}
        </Alert>
      )}
    </Stack>
  )
}
