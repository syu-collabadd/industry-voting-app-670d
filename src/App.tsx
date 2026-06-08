import { useState, useEffect } from 'react'
import { LoginPage } from './pages/LoginPage'
import { MemberPortal } from './pages/MemberPortal'
import { AdminDashboard } from './pages/AdminDashboard'
import { getSession, logout, getAdminSession } from './lib/auth'
import type { Member } from './lib/types'

type AppState = 'loading' | 'login' | 'member' | 'admin'

export default function App() {
  const [state, setState] = useState<AppState>('loading')
  const [member, setMember] = useState<Member | null>(null)

  useEffect(() => {
    if (getAdminSession()) {
      setState('admin')
    } else {
      const m = getSession()
      if (m) {
        setMember(m)
        setState('member')
      } else {
        setState('login')
      }
    }
  }, [])

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (state === 'login') {
    return (
      <LoginPage
        onMemberLogin={(m) => { setMember(m); setState('member') }}
        onAdminLogin={() => setState('admin')}
      />
    )
  }

  if (state === 'member' && member) {
    return (
      <MemberPortal
        member={member}
        onLogout={() => { logout(); setMember(null); setState('login') }}
      />
    )
  }

  if (state === 'admin') {
    return (
      <AdminDashboard
        onLogout={() => setState('login')}
      />
    )
  }

  return null
}
