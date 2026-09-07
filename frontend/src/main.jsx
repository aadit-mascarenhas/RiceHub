import { BrowserRouter } from 'react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AuthProvider from './context/AuthProvider'
import SavedRicesProvider from './context/SavedRicesProvider'
import FiltersProvider from './context/FiltersProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SavedRicesProvider>
          <FiltersProvider>
            <App />
          </FiltersProvider>
        </SavedRicesProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)