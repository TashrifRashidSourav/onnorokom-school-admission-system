import { useId, useState, type FormEvent } from 'react'

/** School admin page: add a class (one shift) with its number of seats. */
export function CreateClassPage() {
  const [name, setName] = useState('')
  const [seats, setSeats] = useState('')
  const nameId = useId()
  const seatsId = useId()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
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
            onChange={(event) => setName(event.target.value)}
            placeholder="Class 6 - Morning Shift"
            autoComplete="off"
          />
        </div>

        <div className="form__field">
          <label htmlFor={seatsId}>Number of seats</label>
          <input
            id={seatsId}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={seats}
            onChange={(event) => setSeats(event.target.value)}
            placeholder="120"
          />
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
