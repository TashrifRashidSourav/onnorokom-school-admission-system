import { useMemo, useState, type ReactNode } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined'
import DonutLargeRoundedIcon from '@mui/icons-material/DonutLargeRounded'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import EventSeatOutlinedIcon from '@mui/icons-material/EventSeatOutlined'
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useSearchParams } from 'react-router'
import { NewClassDialog } from '../../admin/NewClassDialog'
import type { ClassSummary, CreatedClass } from '../../api/types'
import { classNameParts, compareLevels, compareShifts } from '../../classes/classNameParts'
import { ClassesLoadError } from '../../classes/LoadStates'
import { useClasses } from '../../classes/useClasses'
import { seatTotals } from '../../school/seatTotals'
import { school } from '../../school/schoolInfo'

const columns = ['Class', 'Total', 'Confirmed', 'Held', 'Filled', 'Available']

const formatCount = (value: number) => value.toLocaleString('en-US')

/** Columns shown only from tablet width up; on phones their numbers sit under the class name. */
const wideOnly = { display: { xs: 'none', sm: 'table-cell' } }

type SortOrder = 'class' | 'available' | 'filled'

const sortLabels: Record<SortOrder, string> = {
  class: 'Class and shift',
  available: 'Most seats free',
  filled: 'Most filled',
}

/** Share of a class's seats that are taken (held or confirmed), 0 to 100. */
const filledPercent = (c: ClassSummary) =>
  c.totalSeats === 0 ? 0 : Math.round(((c.heldSeats + c.confirmedSeats) / c.totalSeats) * 100)

function sortClasses(classes: ClassSummary[], order: SortOrder): ClassSummary[] {
  const list = [...classes]
  if (order === 'available') return list.sort((a, b) => b.availableSeats - a.availableSeats)
  if (order === 'filled') return list.sort((a, b) => filledPercent(b) - filledPercent(a))
  return list.sort((a, b) => {
    const pa = classNameParts(a.name)
    const pb = classNameParts(b.name)
    return compareLevels(pa.level, pb.level) || compareShifts(pa.shift, pb.shift)
  })
}

interface Kpi {
  label: string
  labelBn: string
  value: string
  hint: string
  icon: ReactNode
  color: string
}

function KpiCards({ classes }: { classes: ClassSummary[] | undefined }) {
  const t = seatTotals(classes ?? [])
  const fill = t.totalSeats === 0 ? 0 : Math.round(((t.heldSeats + t.confirmedSeats) / t.totalSeats) * 100)
  const kpis: Kpi[] = [
    { label: 'Classes & shifts', labelBn: 'ক্লাস', value: formatCount(t.classes), hint: `${t.openClasses} with free seats`, icon: <ClassOutlinedIcon />, color: 'primary.main' },
    { label: 'Total seats', labelBn: 'মোট আসন', value: formatCount(t.totalSeats), hint: `Session ${school.session}`, icon: <EventSeatOutlinedIcon />, color: 'primary.main' },
    { label: 'Admissions confirmed', labelBn: 'নিশ্চিত ভর্তি', value: formatCount(t.confirmedSeats), hint: 'Fee paid', icon: <TaskAltRoundedIcon />, color: 'success.main' },
    { label: 'Seats on hold', labelBn: 'ফি বাকি', value: formatCount(t.heldSeats), hint: 'Waiting for payment', icon: <HourglassTopRoundedIcon />, color: 'warning.main' },
    { label: 'Seats available', labelBn: 'খালি আসন', value: formatCount(t.availableSeats), hint: 'Open for applications', icon: <EventAvailableOutlinedIcon />, color: 'info.main' },
    { label: 'Filled', labelBn: 'পূরণ', value: `${fill}%`, hint: 'Held and confirmed seats', icon: <DonutLargeRoundedIcon />, color: 'secondary.dark' },
  ]
  return (
    <Box
      component="section"
      aria-label="Admission figures"
      sx={{ display: 'grid', gap: 2, mb: 3, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(6, minmax(0, 1fr))' } }}
    >
      {kpis.map((kpi) => (
        <Paper key={kpi.label} sx={{ p: 2, borderRadius: 3 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: kpi.color, mb: 1 }}>
            {kpi.icon}
          </Stack>
          <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.1 }}>
            {classes === undefined ? <Skeleton width={60} /> : kpi.value}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {kpi.label}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {kpi.labelBn} · {kpi.hint}
          </Typography>
        </Paper>
      ))}
    </Box>
  )
}

function FillCell({ seats }: { seats: ClassSummary }) {
  const percent = filledPercent(seats)
  return (
    <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' }, minWidth: 140 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
        <LinearProgress
          variant="determinate"
          value={percent}
          color={percent >= 100 ? 'error' : percent >= 90 ? 'warning' : 'primary'}
          sx={{ width: 80, height: 6, borderRadius: 3 }}
          aria-label={`${seats.name}: ${percent}% filled`}
        />
        <Typography variant="body2" sx={{ width: 40, fontVariantNumeric: 'tabular-nums' }}>
          {percent}%
        </Typography>
      </Stack>
    </TableCell>
  )
}

function NumberCell({ value }: { value: number }) {
  return (
    <TableCell align="right" sx={wideOnly}>
      {formatCount(value)}
    </TableCell>
  )
}

/** Admin dashboard: admission figures, every class with its live seat counts, and New class. */
export function AdminClassesPage() {
  const { data: classes, isPending, isError, error, refetch } = useClasses()
  const [search, setSearch] = useState('')
  const [order, setOrder] = useState<SortOrder>('class')
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sortClasses((classes ?? []).filter((c) => c.name.toLowerCase().includes(q)), order)
  }, [classes, search, order])
  // ?new=1 (the old /admin/classes/new link redirects here) opens the dialog right away.
  const [searchParams, setSearchParams] = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(searchParams.get('new') === '1')
  const [lastCreated, setLastCreated] = useState<CreatedClass | null>(null)
  const openDialog = () => setDialogOpen(true)
  const closeDialog = () => {
    setDialogOpen(false)
    if (searchParams.has('new')) {
      setSearchParams({}, { replace: true })
    }
  }

  return (
    <Box component="section">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, mb: 3 }}
      >
        <Box>
          <Typography variant="overline" color="secondary.dark">
            Admission {school.session} · ভর্তি ড্যাশবোর্ড
          </Typography>
          <Typography variant="h1" gutterBottom>
            Classes and seats
          </Typography>
          <Typography color="text.secondary">
            Each shift is its own class with its own seats. All figures update live, every few seconds.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openDialog}
          sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}
        >
          New class
        </Button>
      </Stack>

      {isError && (
        <ClassesLoadError error={error} stale={classes !== undefined} onRetry={() => void refetch()} />
      )}

      <KpiCards classes={classes} />

      {classes !== undefined && classes.length > 0 && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField
            size="small"
            label="Search classes"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ maxWidth: { sm: 320 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            size="small"
            label="Sort by"
            value={order}
            onChange={(event) => setOrder(event.target.value as SortOrder)}
            sx={{ maxWidth: { sm: 220 } }}
          >
            {(Object.keys(sortLabels) as SortOrder[]).map((key) => (
              <MenuItem key={key} value={key}>
                {sortLabels[key]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table aria-label="Classes and seats">
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell
                  key={column}
                  align={index === 0 ? 'left' : 'right'}
                  sx={
                    index === 0 || index === columns.length - 1
                      ? undefined
                      : column === 'Filled'
                        ? { display: { xs: 'none', md: 'table-cell' } }
                        : wideOnly
                  }
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isPending &&
              [0, 1, 2].map((row) => (
                <TableRow key={row} aria-hidden>
                  {columns.map((column) => (
                    <TableCell key={column} sx={column === 'Class' || column === 'Available' ? undefined : wideOnly}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {classes !== undefined && classes.length > 0 && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  No class matches "{search}".
                </TableCell>
              </TableRow>
            )}

            {rows.map((seats) => (
              <TableRow key={seats.id} hover>
                <TableCell component="th" scope="row" sx={{ overflowWrap: 'break-word' }}>
                  <Box sx={{ fontWeight: 600 }}>{seats.name}</Box>
                  <Typography variant="body2" color="text.secondary" sx={{ display: { sm: 'none' } }}>
                    {formatCount(seats.totalSeats)} total · {formatCount(seats.confirmedSeats)} confirmed ·{' '}
                    {formatCount(seats.heldSeats)} held
                  </Typography>
                </TableCell>
                <NumberCell value={seats.totalSeats} />
                <NumberCell value={seats.confirmedSeats} />
                <NumberCell value={seats.heldSeats} />
                <FillCell seats={seats} />
                <TableCell align="right">
                  {seats.availableSeats <= 0 ? (
                    <Chip label="Full" size="small" color="error" variant="outlined" />
                  ) : (
                    <Box component="strong" sx={{ color: 'primary.main' }}>
                      {formatCount(seats.availableSeats)}
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {classes !== undefined && classes.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ border: 0 }}>
                  <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center', py: 6 }}>
                    <ClassOutlinedIcon color="disabled" sx={{ fontSize: 40 }} />
                    <Typography sx={{ fontWeight: 600 }}>No classes yet</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
                      Create a class for each shift, for example "Class 6 - Morning Shift", to open it for
                      applications.
                    </Typography>
                    <Button startIcon={<AddRoundedIcon />} onClick={openDialog}>
                      Create the first class
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <NewClassDialog open={dialogOpen} onClose={closeDialog} onCreated={setLastCreated} />

      {/* Confirmation that does not push the table down; closes by itself. */}
      <Snackbar
        open={lastCreated !== null}
        autoHideDuration={6000}
        onClose={(_, reason) => reason !== 'clickaway' && setLastCreated(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setLastCreated(null)}
          sx={{ width: '100%', alignItems: 'center' }}
        >
          {lastCreated !== null && (
            <>
              <strong>{lastCreated.name}</strong> created with{' '}
              {lastCreated.totalSeats.toLocaleString('en-US')} seats.
            </>
          )}
        </Alert>
      </Snackbar>
    </Box>
  )
}
