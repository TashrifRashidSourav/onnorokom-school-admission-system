import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { describeError } from '../api/errorMessages'
import { createClass } from '../api/endpoints'
import { queryKeys } from '../api/queryClient'
import type { CreatedClass } from '../api/types'
import {
  hasErrors,
  MAX_SEATS,
  MIN_SEATS,
  validateClassName,
  validateCreateClass,
  validateSeats,
  type CreateClassErrors,
} from '../pages/createClassValidation'

const classLevels = ['Play', 'Nursery', 'KG', ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`)]
const shifts = ['Morning', 'Day', 'Evening']

interface CreateClassFormProps {
  /** Called with the new class after the API created it; the form is then cleared. */
  onCreated: (createdClass: CreatedClass) => void
  /** Lets a container (e.g. a dialog) know while a request is in flight. */
  onPendingChange?: (pending: boolean) => void
  autoFocus?: boolean
  /** Extra buttons shown next to the submit button (e.g. Cancel). */
  secondaryAction?: ReactNode
}

/**
 * Class name + number of seats, validated with the backend's rules, sent to
 * POST /classes. Shows the API's error message in plain language on failure.
 */
export function CreateClassForm({ onCreated, onPendingChange, autoFocus = false, secondaryAction }: CreateClassFormProps) {
  const [name, setName] = useState('')
  const [level, setLevel] = useState('')
  const [shift, setShift] = useState('')
  // Picking a class and a shift writes the name in the school's usual form; it can still be edited.
  const pick = (nextLevel: string, nextShift: string) => {
    setLevel(nextLevel)
    setShift(nextShift)
    if (nextLevel !== '' && nextShift !== '') {
      setName(`${nextLevel} - ${nextShift} Shift`)
      setErrors((current) => ({ ...current, name: undefined }))
    }
  }
  const [seats, setSeats] = useState('')
  const [errors, setErrors] = useState<CreateClassErrors>({})
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createClass,
    onSuccess: (createdClass) => {
      setName('')
      setLevel('')
      setShift('')
      setSeats('')
      setErrors({})
      // Class lists must show the new class right away.
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes })
      onCreated(createdClass)
    },
  })

  useEffect(() => {
    onPendingChange?.(mutation.isPending)
  }, [mutation.isPending, onPendingChange])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (mutation.isPending) {
      return
    }
    mutation.reset()
    const found = validateCreateClass(name, seats)
    setErrors(found)
    if (hasErrors(found)) {
      return
    }
    mutation.mutate({ name: name.trim(), totalSeats: Number(seats.trim()) })
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} noValidate spacing={2.5}>
      {mutation.isError && <Alert severity="error">{errorMessage(mutation.error)}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField select label="Class" value={level} onChange={(event) => pick(event.target.value, shift)}>
          {classLevels.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField select label="Shift" value={shift} onChange={(event) => pick(level, event.target.value)}>
          {shifts.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <TextField
        label="Class name"
        placeholder="Class 6 - Morning Shift"
        autoComplete="off"
        autoFocus={autoFocus}
        value={name}
        onChange={(event) => {
          setName(event.target.value)
          setErrors((current) => ({ ...current, name: undefined }))
        }}
        onBlur={() => name !== '' && setErrors((current) => ({ ...current, name: validateClassName(name) }))}
        error={errors.name !== undefined}
        helperText={errors.name ?? 'Filled in from Class and Shift, or type any name. Each shift is its own class.'}
      />

      <TextField
        label="Number of seats"
        placeholder="120"
        type="number"
        value={seats}
        onChange={(event) => {
          setSeats(event.target.value)
          setErrors((current) => ({ ...current, seats: undefined }))
        }}
        onBlur={() => seats !== '' && setErrors((current) => ({ ...current, seats: validateSeats(seats) }))}
        error={errors.seats !== undefined}
        helperText={errors.seats ?? `Between ${MIN_SEATS} and ${MAX_SEATS.toLocaleString('en-US')}.`}
        slotProps={{ htmlInput: { inputMode: 'numeric', min: MIN_SEATS, max: MAX_SEATS, step: 1 } }}
      />

      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
        {secondaryAction}
        <Button type="submit" variant="contained" size="large" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create class'}
        </Button>
      </Stack>
    </Stack>
  )
}

function errorMessage(error: unknown): string {
  return `Could not create the class. ${describeError(error)}`
}
