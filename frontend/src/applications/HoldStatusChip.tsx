import Chip, { type ChipProps } from '@mui/material/Chip'
import type { HoldStatus } from '../api/types'

const looks: Record<HoldStatus, { label: string; color: ChipProps['color'] }> = {
  HELD: { label: 'Seat held', color: 'warning' },
  CONFIRMED: { label: 'Admission confirmed', color: 'success' },
  EXPIRED: { label: 'Expired', color: 'default' },
  CANCELLED: { label: 'Cancelled', color: 'error' },
}

/** Status of an application as a coloured label. */
export function HoldStatusChip({ status, size = 'medium' }: { status: HoldStatus; size?: ChipProps['size'] }) {
  const look = looks[status]
  return <Chip label={look.label} color={look.color} size={size} variant="outlined" data-status={status} />
}
