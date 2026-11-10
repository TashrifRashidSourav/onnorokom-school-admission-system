import { useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import { useServerStatus } from '../api/serverStatus'

/**
 * A banner at the top of every page while the server is failing. It disappears by
 * itself as soon as a request succeeds again; "Try again" reloads what is on screen.
 */
export function ServerStatusBanner() {
  const status = useServerStatus()
  const queryClient = useQueryClient()

  if (status === 'ok') {
    return null
  }

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 } }}>
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => void queryClient.refetchQueries({ type: 'active' })}>
            Try again
          </Button>
        }
      >
        <AlertTitle>The server ran into a problem</AlertTitle>
        Some information on this page may be out of date. Your applications are safe; please try again in a
        moment.
      </Alert>
    </Container>
  )
}
