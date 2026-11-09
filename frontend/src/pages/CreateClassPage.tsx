import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'
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
} from './createClassValidation'

/** School admin page: add a class (one shift) with its number of seats. */
export function CreateClassPage() {
  const [name, setName] = useState('')
  const [seats, setSeats] = useState('')
  const [errors, setErrors] = useState<CreateClassErrors>({})
  const queryClient = useQueryClient()
  const [created, setCreated] = useState<CreatedClass | null>(null)

  const mutation = useMutation({
    mutationFn: createClass,
    onSuccess: (createdClass) => {
      setCreated(createdClass)
      setName('')
      setSeats('')
      setErrors({})
      // The class list must show the new class right away.
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes })
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (mutation.isPending) {
      return
    }
    setCreated(null)
    const found = validateCreateClass(name, seats)
    setErrors(found)
    if (hasErrors(found)) {
      return
    }
    mutation.mutate({ name: name.trim(), totalSeats: Number(seats.trim()) })
  }

  return (
    <Box component="section">
      <Typography variant="h1" gutterBottom>
        Create class
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 640 }}>
        Add a class for one shift. Each shift is its own class with its own seats, for example
        "Class 6 - Morning Shift" and "Class 6 - Day Shift".
      </Typography>

      <Stack spacing={2} sx={{ mt: 3, maxWidth: 520 }}>
        {created !== null && (
          <Alert severity="success" role="status">
            <strong>{created.name}</strong> was created with{' '}
            {created.totalSeats.toLocaleString('en-US')} seats.{' '}
            <Link component={RouterLink} to="/admin">
              See all classes
            </Link>{' '}
            or add another one below.
          </Alert>
        )}

        {mutation.isError && <Alert severity="error">{errorMessage(mutation.error)}</Alert>}

        <Paper component="form" onSubmit={handleSubmit} noValidate sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Class name"
              placeholder="Class 6 - Morning Shift"
              autoComplete="off"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setErrors((current) => ({ ...current, name: undefined }))
              }}
              onBlur={() =>
                name !== '' && setErrors((current) => ({ ...current, name: validateClassName(name) }))
              }
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
              onBlur={() =>
                seats !== '' && setErrors((current) => ({ ...current, seats: validateSeats(seats) }))
              }
              error={errors.seats !== undefined}
              helperText={errors.seats ?? `Between ${MIN_SEATS} and ${MAX_SEATS.toLocaleString('en-US')}.`}
              slotProps={{ htmlInput: { inputMode: 'numeric', min: MIN_SEATS, max: MAX_SEATS, step: 1 } }}
            />

            <Box>
              <Button type="submit" variant="contained" size="large" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating…' : 'Create class'}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return `Could not create the class. ${error.message}`
  }
  return 'Could not create the class. Please try again.'
}
