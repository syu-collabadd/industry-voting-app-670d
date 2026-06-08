export type MemberType = 'Film' | 'TV' | 'Both'
export type TitleType = 'Film' | 'TV'

export interface Member {
  id: string
  name: string
  email: string
  member_type: MemberType
  token: string
  created_at: string
}

export interface Title {
  id: string
  name: string
  year: number
  type: TitleType
  description: string | null
  created_at: string
}

export interface Vote {
  id: string
  member_id: string
  title_id: string
  score: number
  created_at: string
}

export interface TitleWithStats extends Title {
  vote_count: number
  avg_score: number | null
  has_seal: boolean
  user_vote: number | null
}

export interface Database {
  public: {
    Tables: {
      members: {
        Row: Member
        Insert: Omit<Member, 'id' | 'created_at'>
        Update: Partial<Omit<Member, 'id' | 'created_at'>>
      }
      titles: {
        Row: Title
        Insert: Omit<Title, 'id' | 'created_at'>
        Update: Partial<Omit<Title, 'id' | 'created_at'>>
      }
      votes: {
        Row: Vote
        Insert: Omit<Vote, 'id' | 'created_at'>
        Update: Partial<Omit<Vote, 'id' | 'created_at'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
