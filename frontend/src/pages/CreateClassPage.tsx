import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'
import { CreateClassForm } from '../admin/CreateClassForm'
import type { CreatedClass } from '../api/types'

/** School admin page: add a class (one shift) with its number of seats. */
export function CreateClassPage() {
  const [created, setCreated] = useState<CreatedClass | null>(null)

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

        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <CreateClassForm onCreated={setCreated} />
        </Paper>
      </Stack>
    </Box>
  )
}
