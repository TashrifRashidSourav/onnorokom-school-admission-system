import { useCallback, useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import type { CreatedClass } from '../api/types'
import { CreateClassForm } from './CreateClassForm'

interface NewClassDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (createdClass: CreatedClass) => void
}

/** Admin dialog to add a class (one shift); closes after the class was created. */
export function NewClassDialog({ open, onClose, onCreated }: NewClassDialogProps) {
  const [pending, setPending] = useState(false)
  const handlePendingChange = useCallback((value: boolean) => setPending(value), [])

  // Closing while the request is in flight would hide its result, so wait for it.
  const close = () => {
    if (!pending) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs" aria-labelledby="new-class-title">
      <DialogTitle id="new-class-title" sx={{ fontWeight: 700, pb: 0.5 }}>
        New class
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Each shift is its own class with its own seats, for example "Class 6 - Morning Shift".
        </Typography>
        <CreateClassForm
          autoFocus
          onPendingChange={handlePendingChange}
          onCreated={(createdClass) => {
            onCreated(createdClass)
            onClose()
          }}
          secondaryAction={
            <Button color="inherit" onClick={close} disabled={pending} sx={{ color: 'text.secondary' }}>
              Cancel
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  )
}
