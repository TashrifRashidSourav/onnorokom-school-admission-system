import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { queryClient } from './api/queryClient'
import { StudentIdProvider } from './student/StudentIdProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <StudentIdProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StudentIdProvider>
    </QueryClientProvider>
  </StrictMode>,
)
