import { useMemo, useState } from 'react'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { ClassCard } from '../classes/ClassCard'
import { filterOptions, groupClasses, noFilters, type ClassFilters } from '../classes/classNameParts'
import { ClassCardSkeletons, ClassesLoadError } from '../classes/LoadStates'
import { useClasses } from '../classes/useClasses'
import { SectionHeading } from '../school/SectionHeading'
import { seatTotals } from '../school/seatTotals'
import { school } from '../school/schoolInfo'

const ALL = 'all'

function EmptyBox({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Paper sx={{ py: { xs: 5, md: 7 }, px: 3, borderRadius: 3, borderStyle: 'dashed', textAlign: 'center' }}>
      {icon}
      <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
      <Box sx={{ maxWidth: 440, mx: 'auto', mt: 0.5 }}>{children}</Box>
    </Paper>
  )
}

const cardGrid = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
  gap: 2,
} as const

/** Every class and shift with its live seat counts and an Apply button, with filters. */
export function ClassListPage() {
  const { data: classes, isPending, isError, error, refetch } = useClasses()
  const [filters, setFilters] = useState<ClassFilters>(noFilters)
  const update = (change: Partial<ClassFilters>) => setFilters((current) => ({ ...current, ...change }))

  const options = useMemo(() => filterOptions(classes ?? []), [classes])
  const groups = useMemo(() => groupClasses(classes ?? [], filters), [classes, filters])
  const shown = groups.reduce((count, group) => count + group.classes.length, 0)
  const totals = classes === undefined ? undefined : seatTotals(classes)
  const filtered = JSON.stringify(filters) !== JSON.stringify(noFilters)

  return (
    <Box component="section" aria-labelledby="classes-title">
      <SectionHeading id="classes-title" level="h1" title="Classes and seats" titleBn="ক্লাস ও আসন">
        Every class and shift open for admission in session {school.session}, with its total, held, confirmed and
        available seats. The numbers update every few seconds.
      </SectionHeading>

      {isError && <ClassesLoadError error={error} stale={classes !== undefined} onRetry={() => void refetch()} />}

      {classes !== undefined && classes.length === 0 && (
        <EmptyBox icon={<SchoolOutlinedIcon color="disabled" sx={{ fontSize: 44, mb: 1 }} />} title="No classes are open yet">
          <Typography variant="body2" color="text.secondary">
            Classes appear here as soon as the school opens them for admission. Please check back later.
          </Typography>
        </EmptyBox>
      )}

      {classes !== undefined && classes.length > 0 && (
        <Paper role="search" aria-label="Filter classes" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, mb: 3 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr auto' }, alignItems: 'center' }}>
            <TextField
              size="small"
              label="Search classes"
              placeholder="e.g. Class 6 or Morning"
              value={filters.search}
              onChange={(event) => update({ search: event.target.value })}
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
              label="Class"
              value={filters.level ?? ALL}
              onChange={(event) => update({ level: event.target.value === ALL ? null : event.target.value })}
            >
              <MenuItem value={ALL}>All classes</MenuItem>
              {options.levels.map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch checked={filters.onlyWithSeats} onChange={(event) => update({ onlyWithSeats: event.target.checked })} />
              }
              label="Only with free seats"
              sx={{ mr: 0, whiteSpace: 'nowrap' }}
            />
          </Box>

          {options.shifts.length > 0 && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2, alignItems: { sm: 'center' } }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Shift · শিফট
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={filters.shift ?? ALL}
                onChange={(_, value: string | null) => {
                  if (value !== null) update({ shift: value === ALL ? null : value })
                }}
                aria-label="Shift"
                sx={{ flexWrap: 'wrap' }}
              >
                <ToggleButton value={ALL}>All shifts</ToggleButton>
                {options.shifts.map((shift) => (
                  <ToggleButton key={shift} value={shift}>
                    {shift}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          )}
        </Paper>
      )}

      {totals !== undefined && totals.classes > 0 && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ mb: 2.5, justifyContent: 'space-between', alignItems: { sm: 'center' } }}
        >
          <Typography color="text.secondary" role="status">
            Showing <strong>{shown}</strong> of {totals.classes} classes and shifts ·{' '}
            <strong>{totals.availableSeats.toLocaleString('en-US')}</strong> seats free in total
          </Typography>
          {filtered && (
            <Button size="small" onClick={() => setFilters(noFilters)}>
              Clear filters
            </Button>
          )}
        </Stack>
      )}

      {isPending && (
        <Box aria-busy sx={cardGrid}>
          <ClassCardSkeletons />
        </Box>
      )}

      {classes !== undefined && classes.length > 0 && shown === 0 && (
        <EmptyBox icon={<SearchOffRoundedIcon color="disabled" sx={{ fontSize: 44, mb: 1 }} />} title="No class matches these filters">
          <Button onClick={() => setFilters(noFilters)} sx={{ mt: 1 }}>
            Clear filters
          </Button>
        </EmptyBox>
      )}

      <Stack spacing={4}>
        {groups.map((group) => (
          <Box component="section" key={group.level} aria-label={group.level}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
              <Typography component="h2" variant="h3">
                {group.level}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {group.classes.length === 1 ? '1 shift' : `${group.classes.length} shifts`}
              </Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
            </Stack>
            <Box sx={cardGrid}>
              {group.classes.map((seats) => (
                <ClassCard key={seats.id} seats={seats} />
              ))}
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
