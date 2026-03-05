import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import { ErrorBoundary } from 'react-error-boundary';
import { FullPageError } from './shared/ui/FullPageError';
import './index.css' // <--- ESTA LíNEA ES CRíTICA

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={FullPageError}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

