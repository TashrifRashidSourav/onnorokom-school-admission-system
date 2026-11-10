import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { formatRemaining } from './formatRemaining'

/** The last minute is shown in the warning colour. */
const URGENT_MS = 60_000

/** Big "time left to pay" clock on the application page. */
export function Countdown({ remainingMs }: { remainingMs: number }) {
  const urgent = remainingMs <= URGENT_MS

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: 'center',
        p: 2,
        borderRadius: 2,
        bgcolor: urgent ? 'rgba(180, 83, 9, 0.08)' : 'rgba(29, 78, 216, 0.06)',
      }}
    >
      <TimerOutlinedIcon sx={{ fontSize: 32, color: urgent ? 'warning.main' : 'primary.main' }} />
      <Box>
        <Typography variant="body2" color="text.secondary">
          Time left to pay
        </Typography>
        <Typography
          role="timer"
          data-testid="countdown"
          sx={{
            fontSize: '2rem',
            fontWeight: 700,
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
            color: urgent ? 'warning.main' : 'text.primary',
          }}
        >
          {formatRemaining(remainingMs)}
        </Typography>
      </Box>
    </Stack>
  )
}
