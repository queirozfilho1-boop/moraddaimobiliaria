import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type UserRole = 'superadmin' | 'gestor' | 'corretor'

export interface UserProfile {
  id: string
  user_id: string
  nome: string
  email: string
  role: UserRole
  role_id: string
  avatar_url?: string | null
  telefone?: string | null
  whatsapp?: string | null
  creci?: string | null
  bio?: string | null
  slug: string
  ativo: boolean
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  hasAccess: (requiredRole: UserRole) => boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const isDev = !import.meta.env.VITE_SUPABASE_URL

const DEV_MOCK_PROFILE: UserProfile = {
  id: 'dev-user',
  user_id: 'dev-user',
  nome: 'Administrador (Dev)',
  email: 'admin@moradda.dev',
  role: 'superadmin',
  role_id: 'dev-role',
  avatar_url: null,
  telefone: null,
  whatsapp: null,
  creci: null,
  bio: null,
  slug: 'admin-dev',
  ativo: true,
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users_profiles')
    .select(`
      id,
      user_id,
      nome,
      email,
      avatar_url,
      telefone,
      whatsapp,
      creci,
      bio,
      slug,
      ativo,
      role_id,
      roles ( nome )
    `)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null

  const roleName = (data.roles as any)?.nome as UserRole || 'corretor'

  return {
    id: data.id,
    user_id: data.user_id,
    nome: data.nome,
    email: data.email,
    role: roleName,
    role_id: data.role_id,
    avatar_url: data.avatar_url,
    telefone: data.telefone,
    whatsapp: data.whatsapp,
    creci: data.creci,
    bio: data.bio,
    slug: data.slug,
    ativo: data.ativo,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDev) {
      setProfile(DEV_MOCK_PROFILE)
      setUser({ id: 'dev-user', email: 'admin@moradda.dev' } as User)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id).then((p) => {
          setProfile(p)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id).then((p) => {
          setProfile(p)
          setLoading(false)
        })
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(
    email: string,
    password: string,
  ): Promise<{ error: string | null }> {
    if (isDev) {
      setProfile(DEV_MOCK_PROFILE)
      setUser({ id: 'dev-user', email } as User)
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  async function signOut() {
    if (!isDev) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setProfile(null)
  }

  async function refreshProfile() {
    const currentUser = user
    if (currentUser) {
      const p = await fetchProfile(currentUser.id)
      if (p) setProfile(p)
    }
  }

  function hasAccess(requiredRole: UserRole): boolean {
    if (!profile) return false
    if (profile.role === 'superadmin') return true
    if (profile.role === 'gestor' && requiredRole !== 'superadmin') return true
    return profile.role === requiredRole
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signOut, hasAccess, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
