import { supabase } from './supabase'
import type { Member, Title, TitleWithStats, MemberType, TitleType } from './types'

// ── Titles ──────────────────────────────────────────────────────────────────

export async function getTitlesWithStats(
  memberId: string,
  memberType: MemberType,
): Promise<TitleWithStats[]> {
  const allowedTypes: TitleType[] =
    memberType === 'Both' ? ['Film', 'TV'] : [memberType as TitleType]

  const { data: titles, error: titlesErr } = await supabase
    .from('titles')
    .select('*')
    .in('type', allowedTypes)
    .order('created_at', { ascending: false })

  if (titlesErr || !titles) return []

  const titleIds = titles.map((t) => t.id)

  const { data: votes } = await supabase
    .from('votes')
    .select('title_id, score, member_id')
    .in('title_id', titleIds)

  const statsMap = new Map<string, { count: number; total: number; userVote: number | null }>()
  for (const t of titles) statsMap.set(t.id, { count: 0, total: 0, userVote: null })

  for (const v of votes ?? []) {
    const s = statsMap.get(v.title_id)
    if (!s) continue
    s.count++
    s.total += v.score
    if (v.member_id === memberId) s.userVote = v.score
  }

  return titles.map((t) => {
    const s = statsMap.get(t.id)!
    const avg = s.count > 0 ? s.total / s.count : null
    return {
      ...t,
      vote_count: s.count,
      avg_score: avg,
      has_seal: s.count >= 25 && avg !== null && avg >= 8.5,
      user_vote: s.userVote,
    }
  })
}

export async function getAllTitlesWithStats(): Promise<TitleWithStats[]> {
  const { data: titles, error } = await supabase
    .from('titles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !titles) return []

  const titleIds = titles.map((t) => t.id)
  const { data: votes } = await supabase
    .from('votes')
    .select('title_id, score')
    .in('title_id', titleIds)

  const statsMap = new Map<string, { count: number; total: number }>()
  for (const t of titles) statsMap.set(t.id, { count: 0, total: 0 })
  for (const v of votes ?? []) {
    const s = statsMap.get(v.title_id)
    if (!s) continue
    s.count++
    s.total += v.score
  }

  return titles.map((t) => {
    const s = statsMap.get(t.id)!
    const avg = s.count > 0 ? s.total / s.count : null
    return {
      ...t,
      vote_count: s.count,
      avg_score: avg,
      has_seal: s.count >= 25 && avg !== null && avg >= 8.5,
      user_vote: null,
    }
  })
}

export async function addTitle(title: {
  name: string
  year: number
  type: TitleType
  description: string
}): Promise<Title | null> {
  const { data, error } = await supabase.from('titles').insert(title).select().single()
  if (error) throw new Error(error.message)
  return data as Title
}

export async function updateTitle(
  id: string,
  title: Partial<{ name: string; year: number; type: TitleType; description: string }>,
): Promise<void> {
  const { error } = await supabase.from('titles').update(title).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteTitle(id: string): Promise<void> {
  const { error } = await supabase.from('titles').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Votes ────────────────────────────────────────────────────────────────────

export async function castVote(
  memberId: string,
  titleId: string,
  score: number,
): Promise<void> {
  const { error } = await supabase.from('votes').upsert(
    { member_id: memberId, title_id: titleId, score },
    { onConflict: 'member_id,title_id' },
  )
  if (error) throw new Error(error.message)
}

// ── Members ──────────────────────────────────────────────────────────────────

export async function getMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('name')
  if (error) return []
  return data as Member[]
}

export async function addMember(member: {
  name: string
  email: string
  member_type: MemberType
  token: string
}): Promise<Member | null> {
  const { data, error } = await supabase.from('members').insert(member).select().single()
  if (error) throw new Error(error.message)
  return data as Member
}

export async function updateMember(
  id: string,
  member: Partial<{ name: string; email: string; member_type: MemberType; token: string }>,
): Promise<void> {
  const { error } = await supabase.from('members').update(member).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase.from('members').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function bulkImportMembers(
  members: Array<{ name: string; email: string; member_type: MemberType; token: string }>,
): Promise<{ inserted: number; errors: string[] }> {
  const errors: string[] = []
  let inserted = 0
  const CHUNK = 50
  for (let i = 0; i < members.length; i += CHUNK) {
    const chunk = members.slice(i, i + CHUNK)
    const { data, error } = await supabase.from('members').upsert(chunk, {
      onConflict: 'token',
      ignoreDuplicates: false,
    })
    if (error) {
      errors.push(`Rows ${i + 1}-${i + chunk.length}: ${error.message}`)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inserted += (data as any)?.length ?? chunk.length
    }
  }
  return { inserted, errors }
}
