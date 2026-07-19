import { LoadingState } from '../../shared/components/LoadingState'

export function AppRouter() {
  // TODO: replace with react-router route objects after routing dependency is added.
  return (
    <div style={{ padding: '40px' }}>
      <h2>تجربة LoadingState</h2>
      <LoadingState variant="cards" count={3} />
    </div>
  )
}
