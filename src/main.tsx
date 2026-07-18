import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { LocaleProvider } from './i18n/LocaleContext.tsx'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </StrictMode>,
)
