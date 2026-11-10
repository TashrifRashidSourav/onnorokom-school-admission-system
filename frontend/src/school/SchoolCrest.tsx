import Box from '@mui/material/Box'

/**
 * The school's crest: a shield with an open book and a star, drawn as SVG so it is
 * sharp at every size and needs no image file. Decorative: the school name is always
 * written next to it.
 */
export function SchoolCrest({ size = 44 }: { size?: number }) {
  return (
    <Box component="svg" viewBox="0 0 48 56" aria-hidden sx={{ width: size, height: size * (56 / 48), flexShrink: 0, display: 'block' }}>
      {/* Shield */}
      <path d="M24 2 L45 9 V27 C45 41 35.5 50.5 24 54 C12.5 50.5 3 41 3 27 V9 Z" fill="var(--mui-palette-primary-main)" />
      <path
        d="M24 6 L41.5 11.8 V27 C41.5 38.8 33.6 46.9 24 50 C14.4 46.9 6.5 38.8 6.5 27 V11.8 Z"
        fill="none"
        stroke="var(--mui-palette-secondary-main)"
        strokeWidth="1.6"
      />
      {/* Star */}
      <path
        d="M24 11.5 l1.9 3.9 4.3 .6 -3.1 3 .7 4.3 -3.8 -2 -3.8 2 .7 -4.3 -3.1 -3 4.3 -.6 Z"
        fill="var(--mui-palette-secondary-main)"
      />
      {/* Open book */}
      <path d="M11.5 29 C16 27 20.5 27.5 24 30 V42 C20.5 39.5 16 39 11.5 41 Z" fill="#FFFFFF" />
      <path d="M36.5 29 C32 27 27.5 27.5 24 30 V42 C27.5 39.5 32 39 36.5 41 Z" fill="#F3F4F6" />
      <path d="M24 30 V42" stroke="var(--mui-palette-primary-dark)" strokeWidth="0.8" />
    </Box>
  )
}
