import { useState } from 'react'
import { Film, Tv, ChevronDown, ChevronUp } from 'lucide-react'
import type { TitleWithStats } from '../lib/types'
import { SealBadge } from './SealBadge'
import { ScoreBar } from './ScoreBar'
import { VoteWidget } from './VoteWidget'

interface TitleCardProps {
  title: TitleWithStats
  memberId: string
  onVoted: (titleId: string, score: number) => void
}

export function TitleCard({ title, memberId, onVoted }: TitleCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${
        title.has_seal ? 'border-amber-500/40' : 'border-slate-800'
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  title.type === 'Film'
                    ? 'bg-blue-900/50 text-blue-300'
                    : 'bg-purple-900/50 text-purple-300'
                }`}
              >
                {title.type === 'Film' ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                {title.type}
              </span>
              <span className="text-xs text-slate-500">{title.year}</span>
              {title.has_seal && <SealBadge />}
            </div>
            <h3 className="text-lg font-semibold text-white leading-tight">{title.name}</h3>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-slate-500 mb-1">{title.vote_count} votes</div>
            <ScoreBar score={title.avg_score} />
          </div>
        </div>

        {title.description && (
          <p className="mt-2 text-sm text-slate-400 line-clamp-2">{title.description}</p>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> Hide voting
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              {title.user_vote !== null ? `Change vote (${title.user_vote}/10)` : 'Cast vote'}
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-800 pt-4">
          <VoteWidget
            memberId={memberId}
            titleId={title.id}
            currentVote={title.user_vote}
            onVoted={(score) => onVoted(title.id, score)}
          />
        </div>
      )}
    </div>
  )
}
