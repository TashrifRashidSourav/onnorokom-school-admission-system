import { useEffect, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { getClass } from '../api/endpoints'
import { queryKeys } from '../api/queryClient'
import type { HoldDetails, HoldStatus } from '../api/types'
import { Countdown } from '../applications/Countdown'
import { HoldActions } from '../applications/HoldActions'
import { HoldStatusChip } from '../applications/HoldStatusChip'
import { useHold } from '../applications/useHold'
import { useNow } from '../applications/useNow'
import { monoFontFamily } from '../theme'

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

const explanations: Record<HoldStatus, (expiresAt: string) => string> = {
  HELD: (expiresAt) =>
    `A seat is held for this student. Pay the admission fee before ${formatDateTime(expiresAt)} to confirm the admission; after that the seat goes to the next applicant.`,
  CONFIRMED: () => 'The admission fee is paid and the seat belongs to this student.',
  EXPIRED: () =>
    'The time to pay ran out and the seat was released. You can apply again if the class still has free seats.',
  CANCELLED: () => 'This application was cancelled and its seat was released.',
}

function BackToClasses() {
  return (
    <Button component={RouterLink} to="/" startIcon={<ArrowBackRoundedIcon />} color="inherit" sx={{ mb: 2, color: 'text.secondary' }}>
      All classes
    </Button>
  )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{children}</Box>
    </Box>
  )
}

/**
 * The hold as it is right now. A HELD hold becomes EXPIRED the second its time runs
 * out, on screen, without waiting for the next server response or a page reload.
 */
function useLiveHold(hold: HoldDetails) {
  const queryClient = useQueryClient()
  const running = hold.status === 'HELD'
  const now = useNow(running)
  const remainingMs = Date.parse(hold.expiresAt) - now
  const expiredNow = running && remainingMs <= 0

  useEffect(() => {
    if (expiredNow) {
      // The server agrees (it judges by its own clock); reload the hold and the seats.
      void queryClient.invalidateQueries({ queryKey: queryKeys.hold(hold.holdId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes })
    }
  }, [expiredNow, hold.holdId, queryClient])

  const status: HoldStatus = expiredNow ? 'EXPIRED' : hold.status
  return { status, remainingMs }
}

function ApplicationCard({ hold: loaded }: { hold: HoldDetails }) {
  const { data: schoolClass } = useQuery({
    queryKey: queryKeys.class(loaded.classId),
    queryFn: () => getClass(loaded.classId),
  })
  const { status, remainingMs } = useLiveHold(loaded)
  const hold = { ...loaded, status }

  return (
    <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Application
            </Typography>
            <Typography variant="h1" sx={{ fontSize: { xs: '1.5rem', md: '1.875rem' } }}>
              {schoolClass?.name ?? <Skeleton width={260} />}
            </Typography>
          </Box>
          <Box sx={{ alignSelf: { sm: 'flex-start' } }}>
            <HoldStatusChip status={hold.status} />
          </Box>
        </Stack>

        {hold.status === 'HELD' && <Countdown remainingMs={remainingMs} />}

        <Typography color="text.secondary" role="status">
          {explanations[hold.status](hold.expiresAt)}
        </Typography>

        <HoldActions hold={hold} />

        <Divider />

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          <Detail label={hold.status === 'HELD' ? 'Pay before' : 'Hold ended at'}>
            {formatDateTime(hold.expiresAt)}
          </Detail>
          <Detail label="Application ID">
            <Box component="span" sx={{ fontFamily: monoFontFamily, fontWeight: 500, fontSize: '0.875rem' }}>
              {hold.holdId}
            </Box>
          </Detail>
        </Box>
      </Stack>
    </Paper>
  )
}

/** One application: its class, status and deadline. Opened right after applying. */
export function ApplicationPage() {
  const { holdId = '' } = useParams()
  const { data: hold, error, isPending, refetch } = useHold(holdId)

  if (isPending) {
    return (
      <Box sx={{ maxWidth: 760 }}>
        <BackToClasses />
        <Paper sx={{ p: 4, borderRadius: 3 }} aria-busy>
          <Skeleton width="40%" height={40} />
          <Skeleton width="90%" />
          <Skeleton width="70%" />
        </Paper>
      </Box>
    )
  }

  if (hold === undefined) {
    const notFound = error instanceof ApiError && error.status === 404
    return (
      <Box sx={{ maxWidth: 760 }}>
        <BackToClasses />
        <Alert
          severity={notFound ? 'warning' : 'error'}
          action={
            notFound ? undefined : (
              <Button color="inherit" size="small" onClick={() => void refetch()}>
                Try again
              </Button>
            )
          }
        >
          {notFound
            ? 'This application does not exist. The link may be incomplete or wrong; your applications are listed under My applications.'
            : `The application could not be loaded. ${error instanceof ApiError ? error.message : ''}`}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 760 }}>
      <BackToClasses />
      <ApplicationCard hold={hold} />
    </Box>
  )
}
