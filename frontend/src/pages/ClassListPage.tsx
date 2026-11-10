import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { ClassCard } from '../classes/ClassCard'
import { ClassCardSkeletons, ClassesLoadError } from '../classes/LoadStates'
import { useClasses } from '../classes/useClasses'
import { SectionHeading } from '../school/SectionHeading'
import { school } from '../school/schoolInfo'

function NoClassesYet() {
  return (
    <Paper
      sx={{
        py: { xs: 5, md: 7 },
        px: 3,
        borderRadius: 3,
        borderStyle: 'dashed',
        textAlign: 'center',
      }}
    >
      <SchoolOutlinedIcon color="disabled" sx={{ fontSize: 44, mb: 1 }} />
      <Typography sx={{ fontWeight: 600 }}>No classes are open yet</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mt: 0.5 }}>
        Classes appear here as soon as the school opens them for admission. Please check back later.
      </Typography>
    </Paper>
  )
}

/** Every class and shift with its live seat counts and an Apply button. */
export function ClassListPage() {
  const { data: classes, isPending, isError, error, refetch } = useClasses()

  return (
    <Box>
      <Box component="section" aria-labelledby="classes-title">
        <SectionHeading id="classes-title" level="h1" title="Classes and seats" titleBn="ক্লাস ও আসন">
          Every class and shift open for admission in session {school.session}, with its total, held, confirmed and
          available seats. The numbers update every few seconds.
        </SectionHeading>

        {isError && (
          <ClassesLoadError error={error} stale={classes !== undefined} onRetry={() => void refetch()} />
        )}

        {classes !== undefined && classes.length === 0 && <NoClassesYet />}

        {(isPending || (classes !== undefined && classes.length > 0)) && (
          <Box
            aria-busy={isPending}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            {isPending && <ClassCardSkeletons />}
            {classes?.map((seats) => (
              <ClassCard key={seats.id} seats={seats} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}
