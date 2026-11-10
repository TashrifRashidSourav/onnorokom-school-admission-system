import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router'
import { describeError } from '../api/errorMessages'
import { queryKeys } from '../api/queryClient'
import type { HoldStatus, MyHold } from '../api/types'
import { formatRemaining } from '../applications/formatRemaining'
import { HoldStatusChip } from '../applications/HoldStatusChip'
import { useMyHolds } from '../applications/useMyHolds'
import { useNow } from '../applications/useNow'
import { useStudentId } from '../student/StudentIdContext'

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

const summaries: Record<HoldStatus, (expiresAt: string) => string> = {
  HELD: (expiresAt) => `Pay before ${formatDateTime(expiresAt)}`,
  CONFIRMED: () => 'Fee paid; the seat belongs to this student',
  EXPIRED: (expiresAt) => `Time to pay ran out at ${formatDateTime(expiresAt)}`,
  CANCELLED: () => 'Cancelled; the seat was released',
}

/** A centred, dashed box for "nothing to show yet" situations. */
function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Paper sx={{ py: { xs: 5, md: 7 }, px: 3, borderRadius: 3, borderStyle: 'dashed', textAlign: 'center' }}>
      {icon}
      <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
      <Box sx={{ maxWidth: 440, mx: 'auto', mt: 0.5 }}>{children}</Box>
    </Paper>
  )
}

/**
 * A held seat counts down every second and turns EXPIRED the moment its time runs out,
 * without waiting for the next reload; then the list and seat counts are fetched again.
 */
function useLiveStatus(hold: MyHold) {
  const queryClient = useQueryClient()
  const running = hold.status === 'HELD'
  const now = useNow(running)
  const remainingMs = Date.parse(hold.expiresAt) - now
  const expiredNow = running && remainingMs <= 0

  useEffect(() => {
    if (expiredNow) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myHolds })
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes })
    }
  }, [expiredNow, queryClient])

  const status: HoldStatus = expiredNow ? 'EXPIRED' : hold.status
  return { status, remainingMs }
}

function ApplicationRow({ hold: loaded }: { hold: MyHold }) {
  const { status, remainingMs } = useLiveStatus(loaded)
  const hold = { ...loaded, status }

  return (
    <Paper component="article" aria-label={hold.className} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1.5, sm: 2 }}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1.05rem', overflowWrap: 'anywhere' }}>{hold.className}</Typography>
          <Typography variant="body2" color="text.secondary">
            {summaries[hold.status](hold.expiresAt)}
          </Typography>
          {hold.status === 'HELD' && (
            <Typography
              variant="body2"
              role="timer"
              data-testid="row-countdown"
              sx={{ fontWeight: 600, color: remainingMs <= 60_000 ? 'warning.dark' : 'text.primary' }}
            >
              Time left to pay: {formatRemaining(remainingMs)}
            </Typography>
          )}
        </Box>
        <Stack
          direction={{ xs: 'row', sm: 'column' }}
          spacing={1}
          sx={{ flexShrink: 0, alignItems: { xs: 'center', sm: 'flex-end' }, justifyContent: 'space-between' }}
        >
          <HoldStatusChip status={hold.status} />
          <Button
            component={RouterLink}
            to={`/applications/${encodeURIComponent(hold.holdId)}`}
            variant={hold.status === 'HELD' ? 'contained' : 'text'}
            size="small"
            endIcon={<ChevronRightRoundedIcon />}
            aria-label={`${hold.status === 'HELD' ? 'Pay now' : 'View details'}: ${hold.className}`}
          >
            {hold.status === 'HELD' ? 'Pay now' : 'View details'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

function RowSkeletons() {
  return (
    <>
      {[0, 1, 2].map((index) => (
        <Paper key={index} sx={{ p: 2.5, borderRadius: 3 }} aria-hidden>
          <Skeleton width="45%" height={28} />
          <Skeleton width="35%" />
        </Paper>
      ))}
    </>
  )
}

function ApplicationsList({ studentId }: { studentId: string }) {
  const { data: holds, isPending, isError, error, refetch } = useMyHolds(studentId)
  const message = describeError(error)

  return (
    <Stack spacing={1.5} aria-busy={isPending}>
      {isError && (
        <Alert
          severity={holds === undefined ? 'error' : 'warning'}
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        >
          {holds === undefined
            ? `Your applications could not be loaded. ${message}`
            : `The statuses below may be out of date. ${message}`}
        </Alert>
      )}
      {isPending && <RowSkeletons />}
      {holds !== undefined && holds.length === 0 && (
        <EmptyState
          icon={<AssignmentOutlinedIcon color="disabled" sx={{ fontSize: 44, mb: 1 }} />}
          title="No applications yet"
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Applications for this student appear here as soon as you apply for a seat.
          </Typography>
          <Button component={RouterLink} to="/" variant="contained">
            See classes
          </Button>
        </EmptyState>
      )}
      {holds?.map((hold) => (
        <ApplicationRow key={hold.holdId} hold={hold} />
      ))}
    </Stack>
  )
}

/** Every application of the current student with its status, newest first. */
export function MyApplicationsPage() {
  const { studentId } = useStudentId()

  return (
    <Box sx={{ maxWidth: 760 }}>
      <Typography variant="h1" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, mb: 1 }}>
        My applications
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Every application of this student, newest first. They are kept on the server, so they are
        still here after closing the browser.
      </Typography>

      {studentId === null ? (
        <EmptyState
          icon={<BadgeOutlinedIcon color="disabled" sx={{ fontSize: 44, mb: 1 }} />}
          title="Enter the student ID"
        >
          <Typography variant="body2" color="text.secondary">
            Enter the student&apos;s 17-digit birth registration number at the top of the page to
            see the applications made for this student.
          </Typography>
        </EmptyState>
      ) : (
        <ApplicationsList key={studentId} studentId={studentId} />
      )}
    </Box>
  )
}
