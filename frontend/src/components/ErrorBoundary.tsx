import { Component, type ErrorInfo, type ReactNode } from 'react'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Where "Go to home" leads (the parent portal or the admin console). */
  homePath?: string
}

interface ErrorBoundaryState {
  failed: boolean
}

/**
 * Catches a crash while drawing a page, so the user sees what happened and how to go on
 * instead of a blank screen. Give it a `key` that changes on navigation (the path) so
 * moving to another page starts fresh.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Kept in the browser console for whoever investigates; never shown to the user.
    console.error('Page crashed', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) {
      return this.props.children
    }
    const homePath = this.props.homePath ?? '/'

    return (
      <Paper role="alert" sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, textAlign: 'center', maxWidth: 640, mx: 'auto' }}>
        <ReportProblemOutlinedIcon color="warning" sx={{ fontSize: 48, mb: 1 }} />
        <Typography variant="h2" sx={{ fontSize: '1.375rem', mb: 1 }}>
          Something went wrong on this page
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          The page could not be shown. Your applications and payments are safe on the server. Reloading usually
          fixes this.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload page
          </Button>
          {/* A plain link: works even if the router itself is what failed. */}
          <Button variant="outlined" href={homePath}>
            Go to home
          </Button>
        </Stack>
      </Paper>
    )
  }
}
