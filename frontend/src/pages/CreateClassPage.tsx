import { useId, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
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
  const nameId = useId()
  const seatsId = useId()
  const nameErrorId = useId()
  const seatsErrorId = useId()
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
    <section>
      <h1>Create class</h1>
      <p className="muted">
        School admin: add a class for one shift. Each shift is its own class with its own seats,
        for example "Class 6 - Morning Shift" and "Class 6 - Day Shift".
      </p>

      {created !== null && (
        <div className="alert alert--success" role="status">
          <strong>{created.name}</strong> was created with{' '}
          {created.totalSeats.toLocaleString('en-US')} seats. <Link to="/">See all classes</Link>{' '}
          or add another one below.
        </div>
      )}

      {mutation.isError && (
        <div className="alert alert--error" role="alert">
          {errorMessage(mutation.error)}
        </div>
      )}

      <form className="card form" onSubmit={handleSubmit} noValidate>
        <div className="form__field">
          <label htmlFor={nameId}>Class name</label>
          <input
            id={nameId}
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setErrors((current) => ({ ...current, name: undefined }))
            }}
            onBlur={() =>
              name !== '' && setErrors((current) => ({ ...current, name: validateClassName(name) }))
            }
            placeholder="Class 6 - Morning Shift"
            autoComplete="off"
            aria-invalid={errors.name !== undefined}
            aria-describedby={errors.name !== undefined ? nameErrorId : undefined}
          />
          {errors.name !== undefined && (
            <p id={nameErrorId} className="field-error">
              {errors.name}
            </p>
          )}
        </div>

        <div className="form__field">
          <label htmlFor={seatsId}>Number of seats</label>
          <input
            id={seatsId}
            type="number"
            inputMode="numeric"
            min={MIN_SEATS}
            max={MAX_SEATS}
            step={1}
            value={seats}
            onChange={(event) => {
              setSeats(event.target.value)
              setErrors((current) => ({ ...current, seats: undefined }))
            }}
            onBlur={() =>
              seats !== '' && setErrors((current) => ({ ...current, seats: validateSeats(seats) }))
            }
            placeholder="120"
            aria-invalid={errors.seats !== undefined}
            aria-describedby={errors.seats !== undefined ? seatsErrorId : undefined}
          />
          {errors.seats !== undefined ? (
            <p id={seatsErrorId} className="field-error">
              {errors.seats}
            </p>
          ) : (
            <p className="form__hint">
              Between {MIN_SEATS} and {MAX_SEATS.toLocaleString('en-US')}.
            </p>
          )}
        </div>

        <div className="form__actions">
          <button type="submit" className="button" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating…' : 'Create class'}
          </button>
        </div>
      </form>
    </section>
  )
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return `Could not create the class. ${error.message}`
  }
  return 'Could not create the class. Please try again.'
}
