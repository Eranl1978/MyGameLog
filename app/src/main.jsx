import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error(error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main
        style={{
          minHeight: '100svh',
          display: 'grid',
          placeItems: 'center',
          alignContent: 'center',
          gap: 14,
          padding: 24,
          boxSizing: 'border-box',
          background: '#111317',
          color: '#f8fafc',
          direction: 'rtl',
          textAlign: 'center',
          fontFamily: 'system-ui, Arial, sans-serif',
        }}
      >
        <strong>האפליקציה נתקעה בזמן טעינת המסך</strong>
        <p
          dir="ltr"
          style={{
            width: 'min(100%, 420px)',
            margin: 0,
            padding: 12,
            borderRadius: 8,
            color: '#fecaca',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            overflowWrap: 'anywhere',
            textAlign: 'left',
          }}
        >
          {this.state.error?.message || String(this.state.error)}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            minHeight: 46,
            width: 'min(100%, 260px)',
            border: 0,
            borderRadius: 8,
            background: '#14b8a6',
            color: '#041312',
            font: 'inherit',
            fontWeight: 900,
          }}
        >
          נסה שוב
        </button>
      </main>
    )
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

const isNativeApp = window.Capacitor?.isNativePlatform?.()

if ('serviceWorker' in navigator && !isNativeApp) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.info('Service worker registration skipped:', error)
    })
  })
}
