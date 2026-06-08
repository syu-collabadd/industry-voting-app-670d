import { Award } from 'lucide-react'

export function SealBadge({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  if (size === 'lg') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full seal-badge text-white font-semibold text-sm">
        <Award className="w-4 h-4" />
        <span>SEAL OF EXCELLENCE</span>
      </div>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full seal-badge text-white font-semibold text-xs">
      <Award className="w-3 h-3" />
      SEAL
    </span>
  )
}
