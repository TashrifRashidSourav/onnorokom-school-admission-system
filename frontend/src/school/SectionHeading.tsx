import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface SectionHeadingProps {
  id?: string
  title: string
  titleBn?: string
  children?: ReactNode
  /** h1 for a page title, h2 for a section inside a page. */
  level?: 'h1' | 'h2'
}

/** A section title with its Bangla name and an optional short explanation. */
export function SectionHeading({ id, title, titleBn, children, level = 'h2' }: SectionHeadingProps) {
  return (
    <Box sx={{ mb: 2.5, maxWidth: 760 }}>
      <Typography
        id={id}
        variant={level}
        sx={level === 'h1' ? { fontSize: { xs: '1.75rem', md: '2.25rem' } } : undefined}
      >
        {title}
        {titleBn !== undefined && (
          <Box
            component="span"
            sx={{ display: 'block', fontSize: '0.55em', fontWeight: 600, color: 'secondary.dark', mt: 0.5, letterSpacing: 0 }}
          >
            {titleBn}
          </Box>
        )}
      </Typography>
      {children !== undefined && (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {children}
        </Typography>
      )}
    </Box>
  )
}
