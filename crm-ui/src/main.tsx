import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// TEMP DEBUG: StrictMode removed to test whether its dev-only double-render/
// double-effect behavior is what's flipping `isNew` from true to false shortly
// after the "+ New Prospect" create flow mounts. Restore once confirmed either way.
createRoot(document.getElementById('root')!).render(
  <App />,
)
