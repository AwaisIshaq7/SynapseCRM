import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        {/* Toast notifications — accessible, positioned top-right */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              fontFamily: 'Manrope, Inter, sans-serif',
              fontSize: '14px',
                backdropFilter: 'blur(14px)',
            },
            success: {
              iconTheme: { primary: '#16a34a', secondary: '#fff' },
              style: { background: 'rgba(240, 253, 244, 0.95)', color: '#166534', border: '1px solid rgba(134, 239, 172, 0.7)' },
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#fff' },
              style: { background: 'rgba(254, 242, 242, 0.95)', color: '#991b1b', border: '1px solid rgba(252, 165, 165, 0.7)' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)