import { useId, useState, type FormEvent } from 'react'
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

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = validateCreateClass(name, seats)
    setErrors(found)
    if (hasErrors(found)) {
      return
    }
  }

  return (
    <section>
      <h1>Create class</h1>
      <p className="muted">
        School admin: add a class for one shift. Each shift is its own class with its own seats,
        for example "Class 6 - Morning Shift" and "Class 6 - Day Shift".
      </p>

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
          <button type="submit" className="button">
            Create class
          </button>
        </div>
      </form>
    </section>
  )
}
