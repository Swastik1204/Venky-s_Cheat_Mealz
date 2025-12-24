import Admin from './Admin'

// Temporary wrapper while splitting admin sections; reuses existing Admin component logic.
export default function AdminInventory() {
  return <Admin section="inventory" />
}
