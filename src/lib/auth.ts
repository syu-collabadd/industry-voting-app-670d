import { supabase } from './supabase'
import type { Member } from './types'

const SESSION_KEY = 'screenvote_member'

export async function loginWithToken(token: string): Promise<Member | null> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('token', token.trim().toUpperCase())
    .single()

  if (error || !data) return null
  localStorage.setItem(SESSION_KEY, JSON.stringify(data))
  return data as Member
}

export function getSession(): Member | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Member
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

const ADMIN_KEY = 'screenvote_admin'

export function adminLogin(password: string): boolean {
  const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
  if (password === adminPass) {
    localStorage.setItem(ADMIN_KEY, '1')
    return true
  }
  return false
}

export function getAdminSession(): boolean {
  return localStorage.getItem(ADMIN_KEY) === '1'
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_KEY)
}
