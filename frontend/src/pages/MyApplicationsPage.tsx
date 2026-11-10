import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import MuiTab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router'
import { describeError } from '../api/errorMessages'
import { queryKeys } from '../api/queryClient'
import type { HoldStatus, MyHold } from '../api/types'
import { formatRemaining } from '../applications/formatRemaining'
import { HoldStatusChip } from '../applications/HoldStatusChip'
import { useMyHolds } from '../applications/useMyHolds'
import { useNow } from '../applications/useNow'
import { classNameParts } from '../classes/classNameParts'
import { ShiftChip } from '../classes/ShiftChip'
import { SectionHeading } from '../school/SectionHeading'
import { useStudentId } from '../student/StudentIdContext'
import { monoFontFamily } from '../theme'

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
  const { shift } = classNameParts(hold.className)

  return (
    <Paper
      component="article"
      aria-label={hold.className}
      sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, borderLeft: '4px solid', borderLeftColor: edgeColors[hold.status] }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1.5, sm: 2 }}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1.05rem', overflowWrap: 'anywhere' }}>{hold.className}</Typography>
          {shift !== null && (
            <Box sx={{ my: 0.75 }}>
              <ShiftChip shift={shift} />
            </Box>
          )}
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

const edgeColors: Record<HoldStatus, string> = {
  HELD: 'warning.main',
  CONFIRMED: 'success.main',
  EXPIRED: 'grey.400',
  CANCELLED: 'error.light',
}

type Tab = 'all' | 'active' | 'admitted' | 'ended'

const tabOf: Record<HoldStatus, Exclude<Tab, 'all'>> = {
  HELD: 'active',
  CONFIRMED: 'admitted',
  EXPIRED: 'ended',
  CANCELLED: 'ended',
}

const tabLabels: Record<Tab, string> = {
  all: 'All',
  active: 'Awaiting payment',
  admitted: 'Admitted',
  ended: 'Expired or cancelled',
}

function SummaryTile({ value, label, labelBn, color }: { value: number; label: string; labelBn: string; color: string }) {
  return (
    <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: 'grey.50', border: 1, borderColor: 'divider' }}>
      <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.1, color }}>{value}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {labelBn}
      </Typography>
    </Box>
  )
}

/** Who the applications belong to, and how many are in each state. */
function StudentSummary({ studentId, holds }: { studentId: string; holds: MyHold[] }) {
  const count = (tab: Exclude<Tab, 'all'>) => holds.filter((h) => tabOf[h.status] === tab).length
  return (
    <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
        <BadgeOutlinedIcon color="primary" />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            Student birth registration number · জন্ম নিবন্ধন নম্বর
          </Typography>
          <Typography sx={{ fontFamily: monoFontFamily, fontWeight: 700, overflowWrap: 'anywhere' }}>{studentId}</Typography>
        </Box>
      </Stack>
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' } }}>
        <SummaryTile value={holds.length} label="Applications" labelBn="মোট আবেদন" color="text.primary" />
        <SummaryTile value={count('active')} label="Awaiting payment" labelBn="ফি বাকি" color="warning.dark" />
        <SummaryTile value={count('admitted')} label="Admitted" labelBn="ভর্তি নিশ্চিত" color="success.main" />
        <SummaryTile value={count('ended')} label="Expired or cancelled" labelBn="মেয়াদ শেষ / বাতিল" color="text.secondary" />
      </Box>
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
  const [tab, setTab] = useState<Tab>('all')
  const shown = (holds ?? []).filter((h) => tab === 'all' || tabOf[h.status] === tab)
  const countFor = (t: Tab) => (holds ?? []).filter((h) => t === 'all' || tabOf[h.status] === t).length

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
          <Button component={RouterLink} to="/classes" variant="contained">
            See classes
          </Button>
        </EmptyState>
      )}
      {holds !== undefined && holds.length > 0 && (
        <>
          <StudentSummary studentId={studentId} holds={holds} />
          <Tabs
            value={tab}
            onChange={(_, value: Tab) => setTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            aria-label="Filter applications"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {(Object.keys(tabLabels) as Tab[]).map((t) => (
              <MuiTab key={t} value={t} label={`${tabLabels[t]} (${countFor(t)})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
            ))}
          </Tabs>
          {shown.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No applications in this list.
            </Typography>
          )}
        </>
      )}
      {shown.map((hold) => (
        <ApplicationRow key={hold.holdId} hold={hold} />
      ))}
    </Stack>
  )
}

/** Every application of the current student with its status, newest first. */
export function MyApplicationsPage() {
  const { studentId } = useStudentId()

  return (
    <Box sx={{ maxWidth: 900 }}>
      <SectionHeading level="h1" title="My applications" titleBn="আমার আবেদন">
        Every application of this student, newest first, with its status. They are kept by the school, so they are
        still here after closing the browser.
      </SectionHeading>

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
