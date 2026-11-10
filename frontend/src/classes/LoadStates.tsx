import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import { ApiError } from '../api/client'

/** Placeholder cards while the classes load for the first time. */
export function ClassCardSkeletons({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <Paper key={index} sx={{ p: 2.5, borderRadius: 3 }} aria-hidden>
          <Skeleton width="70%" height={28} />
          <Skeleton width="30%" height={44} sx={{ mt: 1 }} />
          <Skeleton width="50%" />
          <Skeleton variant="rounded" height={8} sx={{ mt: 2 }} />
        </Paper>
      ))}
    </>
  )
}

const messageOf = (error: unknown) =>
  error instanceof ApiError ? error.message : 'Something went wrong while loading the classes.'

interface LoadErrorProps {
  error: unknown
  /** True when older data is still shown under the message. */
  stale: boolean
  onRetry: () => void
}

/**
 * Why the classes could not be loaded. Without data it is an error with a retry button;
 * with older data on screen it is a warning that the numbers may be out of date.
 */
export function ClassesLoadError({ error, stale, onRetry }: LoadErrorProps) {
  return (
    <Alert
      severity={stale ? 'warning' : 'error'}
      sx={{ mb: 2 }}
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          Try again
        </Button>
      }
    >
      {stale
        ? `Seat counts may be out of date. ${messageOf(error)}`
        : `The classes could not be loaded. ${messageOf(error)}`}
    </Alert>
  )
}
