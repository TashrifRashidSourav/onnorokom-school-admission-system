import { useEffect, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { describeError } from '../api/errorMessages'
import { getClass } from '../api/endpoints'
import { queryKeys } from '../api/queryClient'
import type { HoldDetails, HoldStatus } from '../api/types'
import { ApplicationProgress } from '../applications/ApplicationProgress'
import { Countdown } from '../applications/Countdown'
import { HoldActions } from '../applications/HoldActions'
import { HoldStatusChip } from '../applications/HoldStatusChip'
import { useHold } from '../applications/useHold'
import { useNow } from '../applications/useNow'
import { classNameParts } from '../classes/classNameParts'
import { ShiftChip } from '../classes/ShiftChip'
import { SchoolCrest } from '../school/SchoolCrest'
import { school } from '../school/schoolInfo'
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

const detailLabel: Record<HoldStatus, string> = {
  HELD: 'Pay before',
  CONFIRMED: 'Payment deadline',
  EXPIRED: 'Hold ended at',
  CANCELLED: 'Hold would have ended at',
}

function BackToClasses() {
  return (
    <Button
      component={RouterLink}
      to="/classes"
      startIcon={<ArrowBackRoundedIcon />}
      color="inherit"
      className="no-print"
      sx={{ mb: 2, color: 'text.secondary' }}
    >
      All classes
    </Button>
  )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Typography component="dt" variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box component="dd" sx={{ m: 0, fontWeight: 600, overflowWrap: 'anywhere' }}>
        {children}
      </Box>
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

/** Copies the application ID, so parents can keep it or send it to the office. */
function CopyIdButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Tooltip title={copied ? 'Copied' : 'Copy application ID'}>
      <IconButton
        size="small"
        className="no-print"
        aria-label="Copy application ID"
        onClick={() => {
          navigator.clipboard?.writeText(id).then(() => setCopied(true), () => undefined)
        }}
      >
        {copied ? <CheckRoundedIcon fontSize="small" /> : <ContentCopyRoundedIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  )
}

function SlipHeader() {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{
        px: { xs: 2.5, md: 4 },
        py: 2,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        justifyContent: 'space-between',
        alignItems: { sm: 'center' },
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <SchoolCrest size={34} />
        <Box>
          <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>{school.name}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            {school.nameBn}
          </Typography>
        </Box>
      </Stack>
      <Box sx={{ textAlign: { sm: 'right' } }}>
        <Typography sx={{ fontWeight: 700, color: 'secondary.light' }}>Admission application · ভর্তি আবেদন</Typography>
        <Typography variant="body2" sx={{ opacity: 0.85 }}>
          Session {school.session}
        </Typography>
      </Box>
    </Stack>
  )
}

function ApplicationCard({ hold: loaded }: { hold: HoldDetails }) {
  const { data: schoolClass } = useQuery({
    queryKey: queryKeys.class(loaded.classId),
    queryFn: () => getClass(loaded.classId),
  })
  const { status, remainingMs } = useLiveHold(loaded)
  const hold = { ...loaded, status }
  const parts = schoolClass === undefined ? undefined : classNameParts(schoolClass.name)

  return (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <SlipHeader />

      <Stack spacing={3} sx={{ p: { xs: 2.5, md: 4 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h1" sx={{ fontSize: { xs: '1.5rem', md: '1.875rem' }, mb: 1 }}>
              {schoolClass?.name ?? <Skeleton width={260} />}
            </Typography>
            {parts?.shift != null && <ShiftChip shift={parts.shift} />}
          </Box>
          <Box sx={{ alignSelf: { sm: 'flex-start' } }}>
            <HoldStatusChip status={hold.status} />
          </Box>
        </Stack>

        <Box sx={{ overflowX: 'auto', mx: -1, px: 1 }}>
          <ApplicationProgress status={hold.status} />
        </Box>

        {hold.status === 'CONFIRMED' && (
          <Alert severity="success">
            <strong>Admission confirmed · ভর্তি নিশ্চিত.</strong> Keep this slip; the school may ask for the application
            ID.
            <Box className="no-print" sx={{ mt: 1 }}>
              <Button variant="outlined" color="success" size="small" startIcon={<PrintOutlinedIcon />} onClick={() => window.print()}>
                Print slip
              </Button>
            </Box>
          </Alert>
        )}

        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr' }, alignItems: 'start' }}>
          <Stack spacing={2.5}>
            {hold.status === 'HELD' && <Countdown remainingMs={remainingMs} />}

            <Typography color="text.secondary" role="status">
              {explanations[hold.status](hold.expiresAt)}
            </Typography>

            <Box className="no-print" sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
              <Typography sx={{ fontWeight: 600 }}>Admission fee · ভর্তি ফি</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Payment is simulated in this portal: pressing the button counts as a successful payment.
              </Typography>
              <HoldActions hold={hold} />
            </Box>
          </Stack>

          <Box component="dl" sx={{ m: 0, p: 2.5, borderRadius: 2, border: 1, borderColor: 'divider', display: 'grid', gap: 1.75 }}>
            <Detail label="Application ID">
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <Box component="span" sx={{ fontFamily: monoFontFamily, fontWeight: 500, fontSize: '0.875rem' }}>
                  {hold.holdId}
                </Box>
                <CopyIdButton id={hold.holdId} />
              </Stack>
            </Detail>
            <Detail label="Class">{parts?.level ?? '…'}</Detail>
            {parts?.shift != null && <Detail label="Shift">{parts.shift}</Detail>}
            <Detail label="Session">{school.session}</Detail>
            <Detail label={detailLabel[hold.status]}>{formatDateTime(hold.expiresAt)}</Detail>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" className="no-print">
          All applications of this student are listed under{' '}
          <Link component={RouterLink} to="/my-applications">
            My applications
          </Link>
          . Questions? Call the admission office at {school.phone}.
        </Typography>
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
      <Box sx={{ maxWidth: 980 }}>
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
      <Box sx={{ maxWidth: 980 }}>
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
            : `The application could not be loaded. ${describeError(error)}`}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 980 }}>
      <BackToClasses />
      <ApplicationCard hold={hold} />
    </Box>
  )
}
