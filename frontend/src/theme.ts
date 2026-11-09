import { alpha, createTheme } from '@mui/material/styles'

// One custom MUI theme for the whole app: calm and professional rather than
// default Material. Light and dark follow the operating system setting.

const fontFamily = [
  '"Inter Variable"',
  'system-ui',
  '-apple-system',
  '"Segoe UI"',
  'Roboto',
  '"Noto Sans Bengali"',
  'sans-serif',
].join(',')

export const monoFontFamily = 'ui-monospace, "Cascadia Code", Consolas, monospace'

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'media' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1D4ED8', dark: '#1E40AF', light: '#3B82F6', contrastText: '#FFFFFF' },
        success: { main: '#15803D' },
        warning: { main: '#B45309' },
        error: { main: '#B91C1C' },
        info: { main: '#0369A1' },
        background: { default: '#F7F8FA', paper: '#FFFFFF' },
        text: { primary: '#111827', secondary: '#4B5563' },
        divider: '#E5E7EB',
      },
    },
    dark: {
      palette: {
        primary: { main: '#60A5FA', dark: '#3B82F6', light: '#93C5FD', contrastText: '#0B1220' },
        success: { main: '#4ADE80' },
        warning: { main: '#FBBF24' },
        error: { main: '#F87171' },
        info: { main: '#38BDF8' },
        background: { default: '#0B1018', paper: '#121925' },
        text: { primary: '#E5E7EB', secondary: '#9CA3AF' },
        divider: '#1F2937',
      },
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily,
    h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
    h2: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.25 },
    h3: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.35 },
    h4: { fontSize: '1rem', fontWeight: 600 },
    body1: { fontSize: '0.975rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.55 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
    overline: { fontWeight: 600, letterSpacing: '0.08em' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, paddingInline: 16, minHeight: 40 },
        sizeLarge: { minHeight: 48, paddingInline: 22, fontSize: '1rem' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({ backgroundImage: 'none', border: `1px solid ${theme.vars.palette.divider}` }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          boxShadow: `0 1px 2px ${alpha('#101828', 0.04)}, 0 1px 3px ${alpha('#101828', 0.06)}`,
          ...theme.applyStyles('dark', { boxShadow: 'none' }),
        }),
      },
    },
    MuiAppBar: {
      defaultProps: { color: 'inherit', elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
          border: 0,
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
        }),
      },
    },
    MuiTextField: {
      defaultProps: { fullWidth: true },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({ backgroundColor: theme.vars.palette.background.paper }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 999 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, alignItems: 'center' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 14 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: ({ theme }) => ({ fontWeight: 600, color: theme.vars.palette.text.secondary }),
      },
    },
  },
})
