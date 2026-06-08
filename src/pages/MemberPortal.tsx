import { useState, useEffect, useCallback } from 'react'
import { Film, Tv, LogOut, Award, Search, RefreshCw } from 'lucide-react'
import type { Member, TitleWithStats } from '../lib/types'
import { getTitlesWithStats } from '../lib/api'
import { TitleCard } from '../components/TitleCard'
import { SealBadge } from '../components/SealBadge'

interface MemberPortalProps {
  member: Member
  onLogout: () => void
}

type Filter = 'All' | 'Film' | 'TV' | 'Seal' | 'Voted' | 'Unvoted'

export function MemberPortal({ member, onLogout }: MemberPortalProps) {
  const [titles, setTitles] = useState<TitleWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('All')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTitlesWithStats(member.id, member.member_type)
      setTitles(data)
    } catch {
      setError('Failed to load titles. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [member.id, member.member_type])

  useEffect(() => { load() }, [load])

  function handleVoted(titleId: string, score: number) {
    setTitles((prev) =>
      prev.map((t) => {
        if (t.id !== titleId) return t
        const wasVoted = t.user_vote !== null
        const newCount = wasVoted ? t.vote_count : t.vote_count + 1
        const newTotal = (t.avg_score ?? 0) * t.vote_count - (t.user_vote ?? 0) + score
        const newAvg = newTotal / newCount
        return {
          ...t,
          user_vote: score,
          vote_count: newCount,
          avg_score: newAvg,
          has_seal: newCount >= 25 && newAvg >= 8.5,
        }
      }),
    )
  }

  const filtered = titles.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'Film') return t.type === 'Film'
    if (filter === 'TV') return t.type === 'TV'
    if (filter === 'Seal') return t.has_seal
    if (filter === 'Voted') return t.user_vote !== null
    if (filter === 'Unvoted') return t.user_vote === null
    return true
  })

  const votedCount = titles.filter((t) => t.user_vote !== null).length
  const sealCount = titles.filter((t) => t.has_seal).length

  const filters: Filter[] =
    member.member_type === 'Both'
      ? ['All', 'Film', 'TV', 'Seal', 'Voted', 'Unvoted']
      : ['All', 'Seal', 'Voted', 'Unvoted']

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">ScreenVote</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">{member.name}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                {member.member_type === 'Film' ? (
                  <Film className="w-3 h-3" />
                ) : member.member_type === 'TV' ? (
                  <Tv className="w-3 h-3" />
                ) : (
                  <>
                    <Film className="w-3 h-3" />
                    <Tv className="w-3 h-3" />
                  </>
                )}
                {member.member_type} Member
              </p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{titles.length}</div>
            <div className="text-xs text-slate-400 mt-0.5">Available Titles</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{votedCount}</div>
            <div className="text-xs text-slate-400 mt-0.5">Your Votes</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-amber-400">
              <Award className="w-5 h-5" />
              {sealCount}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Seal Titles</div>
          </div>
        </div>

        {sealCount > 0 && (
          <div className="mb-5 p-3 bg-amber-900/10 border border-amber-700/30 rounded-xl flex items-center gap-3">
            <SealBadge size="lg" />
            <p className="text-sm text-amber-200/70">
              {sealCount} title{sealCount !== 1 ? 's have' : ' has'} earned the Seal of Excellence
              (25+ votes, 8.5+ avg)
            </p>
          </div>
        )}

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search titles…"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
            <button
              onClick={load}
              className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading titles…</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <button
              onClick={load}
              className="text-blue-400 text-sm hover:text-blue-300 underline"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            {search ? `No titles match "${search}"` : 'No titles in this category yet.'}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((t) => (
              <TitleCard key={t.id} title={t} memberId={member.id} onVoted={handleVoted} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
