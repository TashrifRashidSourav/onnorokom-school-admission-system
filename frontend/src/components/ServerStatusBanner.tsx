import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import { request } from '../api/client'
import { useServerStatus } from '../api/serverStatus'

/** How often the server is checked again while it cannot be reached. */
const RECHECK_MS = 5_000

function subscribeToNetwork(listener: () => void): () => void {
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)
  return () => {
    window.removeEventListener('online', listener)
    window.removeEventListener('offline', listener)
  }
}

/** False while the browser knows the device has no network at all. */
function useOnline(): boolean {
  return useSyncExternalStore(subscribeToNetwork, () => navigator.onLine)
}

/**
 * While the server cannot be reached, checks /health every few seconds. When it answers
 * again (or the device comes back online), everything on screen is reloaded, so stale
 * seat counts and statuses are replaced without the user doing anything.
 */
function useRecovery(down: boolean, online: boolean) {
  const queryClient = useQueryClient()
  const wasDown = useRef(false)

  useEffect(() => {
    if (!down || !online) {
      return
    }
    const timer = window.setInterval(() => {
      request('/health').catch(() => undefined)
    }, RECHECK_MS)
    return () => window.clearInterval(timer)
  }, [down, online])

  useEffect(() => {
    if (down || !online) {
      wasDown.current = true
      return
    }
    if (wasDown.current) {
      wasDown.current = false
      void queryClient.invalidateQueries()
    }
  }, [down, online, queryClient])
}

/**
 * A banner at the top of every page while the server is failing or cannot be reached.
 * It disappears by itself as soon as the server answers again; "Try again" reloads
 * what is on screen right away.
 */
export function ServerStatusBanner() {
  const status = useServerStatus()
  const online = useOnline()
  const queryClient = useQueryClient()
  useRecovery(status === 'unreachable', online)

  if (online && status === 'ok') {
    return null
  }

  const retry = (
    <Button color="inherit" size="small" onClick={() => void queryClient.refetchQueries({ type: 'active' })}>
      Try again
    </Button>
  )

  let banner
  if (!online) {
    banner = (
      <Alert severity="warning">
        <AlertTitle>You are offline</AlertTitle>
        This device has no internet connection. Seat counts and statuses on this page may be out of date;
        they update by themselves when the connection is back.
      </Alert>
    )
  } else if (status === 'unreachable') {
    banner = (
      <Alert severity="warning" action={retry}>
        <AlertTitle>Cannot reach the server</AlertTitle>
        Seat counts and statuses on this page may be out of date. Checking again every few seconds; the page
        updates by itself when the server is back.
      </Alert>
    )
  } else {
    banner = (
      <Alert severity="error" action={retry}>
        <AlertTitle>The server ran into a problem</AlertTitle>
        Some information on this page may be out of date. Your applications are safe; please try again in a
        moment.
      </Alert>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 } }}>
      {banner}
    </Container>
  )
}
