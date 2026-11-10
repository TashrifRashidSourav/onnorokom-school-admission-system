import { useState } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useSearchParams } from 'react-router'
import { NewClassDialog } from '../../admin/NewClassDialog'
import type { CreatedClass } from '../../api/types'

const columns = ['Class', 'Total', 'Confirmed', 'Held', 'Available']

/**
 * Admin home: every class with its seat counts, and the way to add a class.
 * The rows are filled from the class list API once it exists (PLAN step 13).
 */
export function AdminClassesPage() {
  // ?new=1 (the old /admin/classes/new link redirects here) opens the dialog right away.
  const [searchParams, setSearchParams] = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(searchParams.get('new') === '1')
  const [lastCreated, setLastCreated] = useState<CreatedClass | null>(null)
  const openDialog = () => setDialogOpen(true)
  const closeDialog = () => {
    setDialogOpen(false)
    if (searchParams.has('new')) {
      setSearchParams({}, { replace: true })
    }
  }

  return (
    <Box component="section">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, mb: 3 }}
      >
        <Box>
          <Typography variant="h1" gutterBottom>
            Classes
          </Typography>
          <Typography color="text.secondary">
            Each shift is its own class with its own seats. Seat counts update live.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openDialog}
          sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}
        >
          New class
        </Button>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table aria-label="Classes and seats">
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell key={column} align={index === 0 ? 'left' : 'right'}>
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} sx={{ border: 0 }}>
                <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center', py: 6 }}>
                  <ClassOutlinedIcon color="disabled" sx={{ fontSize: 40 }} />
                  <Typography sx={{ fontWeight: 600 }}>No classes yet</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
                    Create a class for each shift, for example "Class 6 - Morning Shift", to open it for
                    applications.
                  </Typography>
                  <Button startIcon={<AddRoundedIcon />} onClick={openDialog}>
                    Create the first class
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <NewClassDialog open={dialogOpen} onClose={closeDialog} onCreated={setLastCreated} />

      {/* Confirmation that does not push the table down; closes by itself. */}
      <Snackbar
        open={lastCreated !== null}
        autoHideDuration={6000}
        onClose={(_, reason) => reason !== 'clickaway' && setLastCreated(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setLastCreated(null)}
          sx={{ width: '100%', alignItems: 'center' }}
        >
          {lastCreated !== null && (
            <>
              <strong>{lastCreated.name}</strong> created with{' '}
              {lastCreated.totalSeats.toLocaleString('en-US')} seats.
            </>
          )}
        </Alert>
      </Snackbar>
    </Box>
  )
}
