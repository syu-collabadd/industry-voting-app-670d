import { useState, type FormEvent } from 'react'
import { Film, Award, Lock } from 'lucide-react'
import { loginWithToken, adminLogin } from '../lib/auth'
import type { Member } from '../lib/types'

interface LoginPageProps {
  onMemberLogin: (member: Member) => void
  onAdminLogin: () => void
}

export function LoginPage({ onMemberLogin, onAdminLogin }: LoginPageProps) {
  const [token, setToken] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [mode, setMode] = useState<'member' | 'admin'>('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleMemberSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const member = await loginWithToken(token)
      if (!member) {
        setError('Invalid access token. Please check your token and try again.')
      } else {
        onMemberLogin(member)
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleAdminSubmit(e: FormEvent) {
    e.preventDefault()
    const ok = adminLogin(adminPass)
    if (!ok) {
      setError('Incorrect admin password.')
    } else {
      onAdminLogin()
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Logo / header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
          <Film className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">ScreenVote</h1>
        <p className="mt-1 text-slate-400 text-sm">Industry Voting Platform</p>
      </div>

      {/* Tab toggle */}
      <div className="flex bg-slate-900 rounded-xl p-1 mb-6 border border-slate-800">
        <button
          onClick={() => { setMode('member'); setError(null) }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'member'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Member Access
        </button>
        <button
          onClick={() => { setMode('admin'); setError(null) }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'admin'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Admin
        </button>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6">
        {mode === 'member' ? (
          <>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">Member Login</h2>
              <p className="mt-1 text-sm text-slate-400">
                Enter the unique access token you received with your membership.
              </p>
            </div>
            <form onSubmit={handleMemberSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Access Token
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  placeholder="e.g. FILM001"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg tracking-widest uppercase"
                  autoComplete="off"
                  autoFocus
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? 'Verifying…' : 'Enter Platform'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-slate-400" />
                <h2 className="text-lg font-semibold text-white">Admin Access</h2>
              </div>
              <p className="text-sm text-slate-400">Restricted to platform administrators.</p>
            </div>
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="Admin password"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={!adminPass.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
              >
                Sign In
              </button>
            </form>
          </>
        )}
      </div>

      {/* Footer badge */}
      <div className="mt-8 flex items-center gap-2 text-xs text-slate-600">
        <Award className="w-3.5 h-3.5" />
        <span>Members-only platform · Film &amp; TV Industry</span>
      </div>
    </div>
  )
}
