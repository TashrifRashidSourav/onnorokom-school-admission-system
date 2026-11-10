import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { ApiError } from '../api/client'
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
  const [seats, setSeats] = useState('')
  const [errors, setErrors] = useState<CreateClassErrors>({})
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createClass,
    onSuccess: (createdClass) => {
      setName('')
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
        helperText={errors.name}
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
  if (error instanceof ApiError) {
    return `Could not create the class. ${error.message}`
  }
  return 'Could not create the class. Please try again.'
}
