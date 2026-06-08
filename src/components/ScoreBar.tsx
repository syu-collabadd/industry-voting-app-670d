interface ScoreBarProps {
  score: number | null
  maxScore?: number
  showLabel?: boolean
}

export function ScoreBar({ score, maxScore = 10, showLabel = true }: ScoreBarProps) {
  if (score === null) {
    return <span className="text-slate-500 text-sm">No votes yet</span>
  }
  const pct = (score / maxScore) * 100
  const color =
    score >= 8.5
      ? 'bg-amber-400'
      : score >= 7
      ? 'bg-emerald-400'
      : score >= 5
      ? 'bg-blue-400'
      : 'bg-slate-400'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden max-w-24">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className="text-sm font-semibold text-slate-200 tabular-nums w-8">
          {score.toFixed(1)}
        </span>
      )}
    </div>
  )
}
