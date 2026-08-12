import { AppProviders } from './app/providers/AppProviders'
import { AppRouter } from './app/routes/AppRouter'
import { useAccentThemeSync } from './shared/hooks/useAccentThemeSync'

function App() {
  useAccentThemeSync()

  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}

export default App
