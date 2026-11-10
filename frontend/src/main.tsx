import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { BrowserRouter } from 'react-router'
// Inter, self-hosted (no request to a font CDN), one variable font file for all weights.
import '@fontsource-variable/inter'
import './index.css'
import App from './App.tsx'
import { queryClient } from './api/queryClient'
import { ErrorBoundary } from './components/ErrorBoundary'
import { StudentIdProvider } from './student/StudentIdProvider'
import { theme } from './theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <QueryClientProvider client={queryClient}>
        <StudentIdProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </BrowserRouter>
        </StudentIdProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
