import { useId, useState, type FormEvent } from 'react'
import { useStudentId } from './StudentIdContext'
import { isValidStudentId, STUDENT_ID_LENGTH } from './studentId'

/**
 * Top-of-page box for the student's 17-digit birth registration number.
 * This replaces a login: whatever ID is entered here is who the student is.
 */
export function StudentIdBar() {
  const { studentId, setStudentId, clearStudentId } = useStudentId()
  const [editing, setEditing] = useState(studentId === null)
  const [draft, setDraft] = useState(studentId ?? '')
  const [error, setError] = useState<string | null>(null)
  const inputId = useId()
  const errorId = useId()

  if (studentId !== null && !editing) {
    return (
      <div className="student-bar student-bar--set">
        <span>
          Student ID: <strong className="mono">{studentId}</strong>
        </span>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => {
            setDraft(studentId)
            setError(null)
            setEditing(true)
          }}
        >
          Change
        </button>
      </div>
    )
  }

  const entered = draft.trim()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isValidStudentId(entered)) {
      setError(
        `Enter the ${STUDENT_ID_LENGTH}-digit birth registration number, digits only ` +
          `(you entered ${entered.length}).`,
      )
      return
    }
    setStudentId(entered)
    setError(null)
    setEditing(false)
  }

  return (
    <form className="student-bar" onSubmit={handleSubmit} noValidate>
      <label htmlFor={inputId}>Student birth registration number</label>
      <div className="student-bar__row">
        <input
          id={inputId}
          className="mono"
          inputMode="numeric"
          autoComplete="off"
          placeholder="17 digits, e.g. 20152691234567890"
          maxLength={STUDENT_ID_LENGTH + 4}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            setError(null)
          }}
          aria-invalid={error !== null}
          aria-describedby={error !== null ? errorId : undefined}
        />
        <span className="student-bar__count" aria-live="polite">
          {entered.length}/{STUDENT_ID_LENGTH}
        </span>
        <button type="submit" className="button">
          Use this ID
        </button>
        {studentId !== null && (
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              setEditing(false)
              setError(null)
            }}
          >
            Cancel
          </button>
        )}
        {studentId !== null && (
          <button
            type="button"
            className="button button--link"
            onClick={() => {
              clearStudentId()
              setDraft('')
            }}
          >
            Forget ID
          </button>
        )}
      </div>
      {error !== null && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
