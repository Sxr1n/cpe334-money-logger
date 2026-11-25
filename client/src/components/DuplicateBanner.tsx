import { formatDisplayDate } from '../format'
import type { LoadedDuplicate } from '../duplicate'

// F-14 banner on the Pay/Receive forms; nothing is stored until the normal Save.
export default function DuplicateBanner({ loaded, error }: { loaded: LoadedDuplicate | null; error: string | null }) {
  if (error) return <div className="alert alert-warning" role="alert">{error}</div>
  if (!loaded) return null
  return (
    <div className="alert alert-info" role="status">
      <div>Duplicated from the transaction of {formatDisplayDate(loaded.sourceDate)} — nothing is saved until you click Save</div>
      {loaded.archived.length > 0 && <div>Archived accounts were left empty: {loaded.archived.join(', ')}</div>}
    </div>
  )
}
