import { useState, type FormEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { monoFontFamily } from '../theme'
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

  if (studentId !== null && !editing) {
    return (
      <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          Student ID
        </Typography>
        <Typography
          component="strong"
          data-testid="current-student-id"
          sx={{ fontFamily: monoFontFamily, fontWeight: 600 }}
        >
          {studentId}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setDraft(studentId)
            setError(null)
            setEditing(true)
          }}
        >
          Change
        </Button>
      </Stack>
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
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label="Student birth registration number"
          placeholder="17 digits, e.g. 20152691234567890"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            setError(null)
          }}
          error={error !== null}
          helperText={error ?? `${entered.length}/${STUDENT_ID_LENGTH} digits`}
          autoComplete="off"
          slotProps={{
            htmlInput: { inputMode: 'numeric', maxLength: STUDENT_ID_LENGTH + 4, style: { fontFamily: monoFontFamily } },
            formHelperText: { role: error !== null ? 'alert' : undefined },
          }}
          sx={{ flex: '1 1 260px', maxWidth: 340 }}
        />
        <Button type="submit" variant="contained">
          Use this ID
        </Button>
        {studentId !== null && (
          <Button
            onClick={() => {
              setEditing(false)
              setError(null)
            }}
          >
            Cancel
          </Button>
        )}
        {studentId !== null && (
          <Button
            color="inherit"
            onClick={() => {
              clearStudentId()
              setDraft('')
            }}
          >
            Forget ID
          </Button>
        )}
      </Stack>
    </Box>
  )
}
