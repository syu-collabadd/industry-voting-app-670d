import { useState, useEffect, useRef, type FormEvent } from 'react'
import {
  Film, Tv, Users, BarChart3, LogOut, Plus, Pencil, Trash2,
  Upload, Award, ChevronDown, ChevronUp, X, Check, AlertCircle, RefreshCw,
} from 'lucide-react'
import type { Member, Title, TitleWithStats, MemberType, TitleType } from '../lib/types'
import {
  getAllTitlesWithStats, addTitle, updateTitle, deleteTitle,
  getMembers, addMember, updateMember, deleteMember, bulkImportMembers,
} from '../lib/api'
import { SealBadge } from '../components/SealBadge'
import { ScoreBar } from '../components/ScoreBar'
import { adminLogout } from '../lib/auth'

type Tab = 'analytics' | 'titles' | 'members'

interface AdminDashboardProps {
  onLogout: () => void
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>('analytics')

  function handleLogout() {
    adminLogout()
    onLogout()
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white">ScreenVote</span>
              <span className="ml-2 text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Admin</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="border-b border-slate-800 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          {([
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'titles', label: 'Titles', icon: Film },
            { id: 'members', label: 'Members', icon: Users },
          ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all ${
                tab === id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'analytics' && <AnalyticsTab />}
        {tab === 'titles' && <TitlesTab />}
        {tab === 'members' && <MembersTab />}
      </main>
    </div>
  )
}

// ── Analytics Tab ──────────────────────────────────────────────────────────

function AnalyticsTab() {
  const [titles, setTitles] = useState<TitleWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'avg' | 'votes' | 'name'>('votes')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [typeFilter, setTypeFilter] = useState<'All' | 'Film' | 'TV'>('All')

  useEffect(() => {
    getAllTitlesWithStats().then((d) => { setTitles(d); setLoading(false) })
  }, [])

  function toggleSort(col: 'avg' | 'votes' | 'name') {
    if (sort === col) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSort(col); setSortDir('desc') }
  }

  const filtered = titles
    .filter((t) => typeFilter === 'All' || t.type === typeFilter)
    .sort((a, b) => {
      let cmp = 0
      if (sort === 'avg') cmp = (a.avg_score ?? -1) - (b.avg_score ?? -1)
      else if (sort === 'votes') cmp = a.vote_count - b.vote_count
      else cmp = a.name.localeCompare(b.name)
      return sortDir === 'desc' ? -cmp : cmp
    })

  const sealTitles = titles.filter((t) => t.has_seal)
  const totalVotes = titles.reduce((s, t) => s + t.vote_count, 0)

  function SortIcon({ col }: { col: 'avg' | 'votes' | 'name' }) {
    if (sort !== col) return null
    return sortDir === 'desc' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Titles', value: titles.length, color: 'text-white' },
          { label: 'Total Votes', value: totalVotes, color: 'text-blue-400' },
          { label: 'Seal Titles', value: sealTitles.length, color: 'text-amber-400' },
          {
            label: 'Overall Avg',
            value: totalVotes > 0
              ? (titles.reduce((s, t) => s + (t.avg_score ?? 0) * t.vote_count, 0) / totalVotes).toFixed(2)
              : '—',
            color: 'text-emerald-400',
          },
        ].map((c) => (
          <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Seal titles callout */}
      {sealTitles.length > 0 && (
        <div className="p-4 bg-amber-900/10 border border-amber-700/30 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-amber-200 text-sm">Seal of Excellence Recipients</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {sealTitles.map((t) => (
              <span key={t.id} className="inline-flex items-center gap-1.5 bg-amber-900/30 border border-amber-700/40 rounded-lg px-3 py-1.5 text-sm text-amber-200">
                {t.type === 'Film' ? <Film className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
                {t.name} ({t.year})
                <span className="text-amber-400 font-semibold">{t.avg_score?.toFixed(1)}</span>
                <span className="text-amber-500/70 text-xs">{t.vote_count}v</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">Filter:</span>
        {(['All', 'Film', 'TV'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === t ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading…</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400">
                <th className="text-left px-4 py-3">
                  <button className="flex items-center gap-1 hover:text-slate-200" onClick={() => toggleSort('name')}>
                    Title <SortIcon col="name" />
                  </button>
                </th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-right px-4 py-3">
                  <button className="flex items-center gap-1 ml-auto hover:text-slate-200" onClick={() => toggleSort('votes')}>
                    Votes <SortIcon col="votes" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button className="flex items-center gap-1 hover:text-slate-200" onClick={() => toggleSort('avg')}>
                    Avg Score <SortIcon col="avg" />
                  </button>
                </th>
                <th className="text-center px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr
                  key={t.id}
                  className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-white">
                    {t.name}
                    <span className="ml-2 text-xs text-slate-500">{t.year}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      t.type === 'Film' ? 'bg-blue-900/40 text-blue-300' : 'bg-purple-900/40 text-purple-300'
                    }`}>
                      {t.type === 'Film' ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    <span className={t.vote_count >= 25 ? 'text-emerald-400' : 'text-slate-300'}>
                      {t.vote_count}
                    </span>
                    {t.vote_count < 25 && (
                      <span className="text-xs text-slate-600 ml-1">/ 25</span>
                    )}
                  </td>
                  <td className="px-4 py-3 w-40">
                    <ScoreBar score={t.avg_score} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {t.has_seal ? (
                      <SealBadge />
                    ) : t.vote_count >= 25 ? (
                      <span className="text-xs text-slate-400">Below threshold</span>
                    ) : (
                      <span className="text-xs text-slate-600">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-sm">
                    No titles yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Titles Tab ─────────────────────────────────────────────────────────────

function TitlesTab() {
  const [titles, setTitles] = useState<TitleWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Title | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => { reload() }, [])

  async function reload() {
    setLoading(true)
    const d = await getAllTitlesWithStats()
    setTitles(d)
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? All votes will be removed.`)) return
    try {
      await deleteTitle(id)
      setTitles((prev) => prev.filter((t) => t.id !== id))
      setMsg({ type: 'ok', text: `"${name}" deleted.` })
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Delete failed' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Manage Titles</h2>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Title
        </button>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg border ${
          msg.type === 'ok' ? 'bg-emerald-900/20 border-emerald-700/40 text-emerald-300' : 'bg-red-900/20 border-red-700/40 text-red-300'
        }`}>
          {msg.type === 'ok' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {(showForm || editing) && (
        <TitleForm
          initial={editing ?? undefined}
          onSave={async (data) => {
            try {
              if (editing) {
                await updateTitle(editing.id, data)
                setMsg({ type: 'ok', text: `"${data.name}" updated.` })
              } else {
                await addTitle({ ...data, year: Number(data.year) })
                setMsg({ type: 'ok', text: `"${data.name}" added.` })
              }
              setShowForm(false)
              setEditing(null)
              reload()
            } catch (e) {
              setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Save failed' })
            }
          }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400">
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Year</th>
                <th className="text-right px-4 py-3">Votes</th>
                <th className="text-left px-4 py-3">Avg</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {titles.map((t, i) => (
                <tr key={t.id} className={`border-b border-slate-800/50 hover:bg-slate-800/20 ${i === titles.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-4 py-3 text-white font-medium">
                    {t.name}
                    {t.has_seal && <span className="ml-2"><SealBadge /></span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.type === 'Film' ? 'bg-blue-900/40 text-blue-300' : 'bg-purple-900/40 text-purple-300'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{t.year}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-300">{t.vote_count}</td>
                  <td className="px-4 py-3 w-32"><ScoreBar score={t.avg_score} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => { setEditing(t); setShowForm(false) }}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id, t.name)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {titles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">
                    No titles yet. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

interface TitleFormProps {
  initial?: Partial<Title>
  onSave: (data: { name: string; year: number; type: TitleType; description: string }) => Promise<void>
  onCancel: () => void
}

function TitleForm({ initial, onSave, onCancel }: TitleFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [year, setYear] = useState(String(initial?.year ?? new Date().getFullYear()))
  const [type, setType] = useState<TitleType>(initial?.type ?? 'Film')
  const [desc, setDesc] = useState(initial?.description ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ name, year: Number(year), type, description: desc })
    setSaving(false)
  }

  return (
    <div className="bg-slate-900 border border-blue-800/40 rounded-xl p-5">
      <h3 className="font-semibold text-white mb-4">{initial?.id ? 'Edit Title' : 'Add New Title'}</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Title Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Year *</label>
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)} required min={1900} max={2099}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Type *</label>
          <select value={type} onChange={(e) => setType(e.target.value as TitleType)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="Film">Film</option>
            <option value="TV">TV</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Description</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div className="sm:col-span-2 flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors">
            {saving ? 'Saving…' : initial?.id ? 'Update' : 'Add Title'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Members Tab ────────────────────────────────────────────────────────────

function MembersTab() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => { reload() }, [])

  async function reload() {
    setLoading(true)
    const d = await getMembers()
    setMembers(d)
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove member "${name}"?`)) return
    try {
      await deleteMember(id)
      setMembers((prev) => prev.filter((m) => m.id !== id))
      setMsg({ type: 'ok', text: `"${name}" removed.` })
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Delete failed' })
    }
  }

  const filtered = members.filter(
    (m) =>
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.token.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-white">
          Members <span className="text-slate-500 text-sm font-normal ml-1">({members.length})</span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowImport(true); setShowForm(false); setEditing(null) }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button
            onClick={() => { setEditing(null); setShowForm(true); setShowImport(false) }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg border ${
          msg.type === 'ok' ? 'bg-emerald-900/20 border-emerald-700/40 text-emerald-300' : 'bg-red-900/20 border-red-700/40 text-red-300'
        }`}>
          {msg.type === 'ok' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {(showForm || editing) && (
        <MemberForm
          initial={editing ?? undefined}
          onSave={async (data) => {
            try {
              if (editing) {
                await updateMember(editing.id, data)
                setMsg({ type: 'ok', text: `"${data.name}" updated.` })
              } else {
                await addMember(data)
                setMsg({ type: 'ok', text: `"${data.name}" added.` })
              }
              setShowForm(false)
              setEditing(null)
              reload()
            } catch (e) {
              setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Save failed' })
            }
          }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {showImport && (
        <CsvImport
          onImported={(result) => {
            setShowImport(false)
            setMsg({ type: result.errors.length > 0 ? 'err' : 'ok', text: `Imported ${result.inserted} members.${result.errors.length > 0 ? ` Errors: ${result.errors.join('; ')}` : ''}` })
            reload()
          }}
          onCancel={() => setShowImport(false)}
        />
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, email, or token…"
        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />

      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Token</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} className={`border-b border-slate-800/50 hover:bg-slate-800/20 ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-4 py-3 text-white font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{m.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      m.member_type === 'Film' ? 'bg-blue-900/40 text-blue-300'
                        : m.member_type === 'TV' ? 'bg-purple-900/40 text-purple-300'
                        : 'bg-emerald-900/40 text-emerald-300'
                    }`}>
                      {m.member_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">{m.token}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => { setEditing(m); setShowForm(false) }}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(m.id, m.name)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-sm">
                    {search ? `No members match "${search}"` : 'No members yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

interface MemberFormProps {
  initial?: Partial<Member>
  onSave: (data: { name: string; email: string; member_type: MemberType; token: string }) => Promise<void>
  onCancel: () => void
}

function MemberForm({ initial, onSave, onCancel }: MemberFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [type, setType] = useState<MemberType>(initial?.member_type ?? 'Film')
  const [token, setToken] = useState(initial?.token ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ name, email, member_type: type, token: token.toUpperCase() })
    setSaving(false)
  }

  return (
    <div className="bg-slate-900 border border-blue-800/40 rounded-xl p-5">
      <h3 className="font-semibold text-white mb-4">{initial?.id ? 'Edit Member' : 'Add New Member'}</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Email *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Member Type *</label>
          <select value={type} onChange={(e) => setType(e.target.value as MemberType)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="Film">Film</option>
            <option value="TV">TV</option>
            <option value="Both">Both</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Access Token *</label>
          <input value={token} onChange={(e) => setToken(e.target.value.toUpperCase())} required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="e.g. FILM001" />
        </div>
        <div className="sm:col-span-2 flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors">
            {saving ? 'Saving…' : initial?.id ? 'Update' : 'Add Member'}
          </button>
        </div>
      </form>
    </div>
  )
}

interface CsvImportProps {
  onImported: (result: { inserted: number; errors: string[] }) => void
  onCancel: () => void
}

function CsvImport({ onImported, onCancel }: CsvImportProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<Array<{ name: string; email: string; member_type: MemberType; token: string }>>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      parseCsv(text)
    }
    reader.readAsText(file)
  }

  function parseCsv(text: string) {
    setParseError(null)
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length < 2) { setParseError('CSV must have a header row and at least one data row.'); return }
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const nameIdx = headers.indexOf('name')
    const emailIdx = headers.indexOf('email')
    const typeIdx = headers.findIndex((h) => h === 'member_type' || h === 'type')
    const tokenIdx = headers.indexOf('token')
    if ([nameIdx, emailIdx, typeIdx, tokenIdx].includes(-1)) {
      setParseError('CSV must have columns: name, email, member_type (or type), token')
      return
    }
    const rows: Array<{ name: string; email: string; member_type: MemberType; token: string }> = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
      const rawType = cols[typeIdx] ?? ''
      const memberType: MemberType =
        rawType === 'Film' || rawType === 'TV' || rawType === 'Both' ? rawType : 'Film'
      rows.push({
        name: cols[nameIdx] ?? '',
        email: cols[emailIdx] ?? '',
        member_type: memberType,
        token: (cols[tokenIdx] ?? '').toUpperCase(),
      })
    }
    setPreview(rows)
  }

  async function handleImport() {
    setImporting(true)
    const result = await bulkImportMembers(preview)
    setImporting(false)
    onImported(result)
  }

  return (
    <div className="bg-slate-900 border border-blue-800/40 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Import Members from CSV</h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
      </div>
      <div className="text-xs text-slate-400 bg-slate-800 rounded-lg p-3 font-mono">
        Required columns: <span className="text-blue-300">name, email, member_type, token</span><br />
        member_type values: Film | TV | Both
      </div>
      <input type="file" accept=".csv,.txt" ref={fileRef} onChange={handleFile} className="hidden" />
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm rounded-lg transition-colors w-full justify-center"
      >
        <Upload className="w-4 h-4" /> Choose CSV File
      </button>
      {parseError && <p className="text-sm text-red-400">{parseError}</p>}
      {preview.length > 0 && (
        <>
          <div className="text-sm text-slate-300">
            <span className="font-semibold text-white">{preview.length}</span> members ready to import
          </div>
          <div className="max-h-40 overflow-y-auto bg-slate-800 rounded-lg text-xs font-mono p-3 space-y-1">
            {preview.slice(0, 10).map((m, i) => (
              <div key={i} className="text-slate-300">
                {m.token} · {m.name} · {m.email} · {m.member_type}
              </div>
            ))}
            {preview.length > 10 && <div className="text-slate-500">…and {preview.length - 10} more</div>}
          </div>
          <div className="flex gap-2">
            <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm text-slate-400 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors"
            >
              {importing ? 'Importing…' : `Import ${preview.length} Members`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
