import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { FileUploadProvider } from './contexts/FileUploadContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FileUploadProvider>
      <App />
    </FileUploadProvider>
  </StrictMode>,
)
