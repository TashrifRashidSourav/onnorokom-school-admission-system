import { useState, type FormEvent } from 'react'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { monoFontFamily } from '../theme'
import { useStudentId } from './StudentIdContext'
import { isValidStudentId, STUDENT_ID_LENGTH } from './studentId'

// The student's 17-digit birth registration number replaces a login: whatever ID
// is entered here is who the student is. Before an ID is entered, a prompt band sits
// under the app bar; afterwards the app bar shows a compact button to change it.

interface StudentIdFormProps {
  /** Called after a valid ID was saved. */
  onDone?: () => void
  autoFocus?: boolean
}

/** Input with digit counter and validation; saves the ID on submit. */
export function StudentIdForm({ onDone, autoFocus = false }: StudentIdFormProps) {
  const { studentId, setStudentId } = useStudentId()
  const [draft, setDraft] = useState(studentId ?? '')
  const [error, setError] = useState<string | null>(null)
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
    onDone?.()
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label="Student birth registration number"
          placeholder="17 digits, e.g. 20152691234567890"
          value={draft}
          autoFocus={autoFocus}
          onChange={(event) => {
            setDraft(event.target.value)
            setError(null)
          }}
          error={error !== null}
          helperText={error ?? `${entered.length}/${STUDENT_ID_LENGTH} digits`}
          autoComplete="off"
          slotProps={{
            htmlInput: {
              inputMode: 'numeric',
              maxLength: STUDENT_ID_LENGTH + 4,
              style: { fontFamily: monoFontFamily },
            },
            formHelperText: { role: error !== null ? 'alert' : undefined },
          }}
          sx={{ flex: '1 1 260px', maxWidth: 360 }}
        />
        <Button type="submit" variant="contained">
          Use this ID
        </Button>
      </Stack>
    </Box>
  )
}

/** Band under the app bar asking for the student ID; hidden once an ID is set. */
export function StudentIdPrompt() {
  const { studentId } = useStudentId()
  if (studentId !== null) {
    return null
  }

  return (
    <Box sx={{ bgcolor: 'rgba(29, 78, 216, 0.05)', borderBottom: 1, borderColor: 'divider' }}>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 1.5, md: 4 }}
          sx={{ alignItems: { md: 'center' } }}
        >
          {/* Fixed widths only side by side; stacked on phones they would turn into heights. */}
          <Box sx={{ flex: { md: '0 1 380px' } }}>
            <Typography sx={{ fontWeight: 600 }}>Who is applying?</Typography>
            <Typography variant="body2" color="text.secondary">
              Enter the student's 17-digit birth registration number. It identifies the student; no
              account or password is needed.
            </Typography>
          </Box>
          <Box sx={{ flex: { md: 1 } }}>
            <StudentIdForm />
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}

/** Compact app bar button showing the current student ID; opens a panel to change it. */
export function StudentIdHeaderButton() {
  const { studentId, clearStudentId } = useStudentId()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  if (studentId === null) {
    return null
  }

  const close = () => setAnchor(null)

  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<BadgeOutlinedIcon />}
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-haspopup="dialog"
        aria-label={`Student ID ${studentId}. Change`}
        sx={{ borderColor: 'divider', bgcolor: 'background.paper', textAlign: 'left' }}
      >
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, color: 'text.secondary', mr: 1 }}>
          Student ID
        </Box>
        <Box
          component="strong"
          data-testid="current-student-id"
          sx={{ fontFamily: monoFontFamily, fontWeight: 600, display: { xs: 'none', sm: 'inline' } }}
        >
          {studentId}
        </Box>
        {/* Phones: only the last digits fit next to the logo; the panel shows the full ID. */}
        <Box
          component="strong"
          aria-hidden
          sx={{ fontFamily: monoFontFamily, fontWeight: 600, display: { xs: 'inline', sm: 'none' } }}
        >
          …{studentId.slice(-4)}
        </Box>
      </Button>

      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1, p: 2.5, width: 420, maxWidth: 'calc(100vw - 32px)' } } }}
      >
        <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Change student</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Applications are shown for the student ID entered here.
        </Typography>
        <StudentIdForm onDone={close} autoFocus />
        <Button
          color="inherit"
          size="small"
          sx={{ mt: 1, color: 'text.secondary' }}
          onClick={() => {
            clearStudentId()
            close()
          }}
        >
          Forget this ID on this device
        </Button>
      </Popover>
    </>
  )
}
