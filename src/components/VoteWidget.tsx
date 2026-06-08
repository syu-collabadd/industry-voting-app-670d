import { useState } from 'react'
import { castVote } from '../lib/api'

interface VoteWidgetProps {
  memberId: string
  titleId: string
  currentVote: number | null
  onVoted: (score: number) => void
}

export function VoteWidget({ memberId, titleId, currentVote, onVoted }: VoteWidgetProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [selected, setSelected] = useState<number | null>(currentVote)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const active = hovered ?? selected

  async function handleVote(score: number) {
    setLoading(true)
    setError(null)
    try {
      await castVote(memberId, titleId, score)
      setSelected(score)
      onVoted(score)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Vote failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 flex-wrap" onMouseLeave={() => setHovered(null)}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            disabled={loading}
            onMouseEnter={() => setHovered(n)}
            onClick={() => handleVote(n)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
              active !== null && n <= active
                ? 'bg-blue-500 text-white scale-110'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            } ${selected === n ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-950' : ''}`}
          >
            {n}
          </button>
        ))}
      </div>
      {selected !== null && (
        <p className="text-xs text-slate-400">
          Your vote: <span className="text-blue-400 font-semibold">{selected}/10</span>
          {' '}· Click to change
        </p>
      )}
      {!selected && (
        <p className="text-xs text-slate-500">Select a score from 1 (lowest) to 10 (highest)</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
