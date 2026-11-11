import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import WbTwilightOutlinedIcon from '@mui/icons-material/WbTwilightOutlined'
import Chip from '@mui/material/Chip'

const shiftBn: Record<string, string> = { Morning: 'প্রভাতি', Day: 'দিবা', Evening: 'সান্ধ্য' }

function shiftIcon(shift: string) {
  if (shift === 'Morning') return <WbTwilightOutlinedIcon />
  if (shift === 'Day') return <LightModeOutlinedIcon />
  if (shift === 'Evening') return <BedtimeOutlinedIcon />
  return <ScheduleOutlinedIcon />
}

/** The shift of a class, e.g. "Morning shift · প্রভাতি", with a matching icon. */
export function ShiftChip({ shift, size = 'small' }: { shift: string; size?: 'small' | 'medium' }) {
  const bn = shiftBn[shift]
  return (
    <Chip
      icon={shiftIcon(shift)}
      label={bn === undefined ? `${shift} shift` : `${shift} shift · ${bn}`}
      size={size}
      variant="outlined"
      sx={{ color: 'primary.dark', borderColor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.3)', '& .MuiChip-icon': { color: 'secondary.dark' } }}
    />
  )
}
