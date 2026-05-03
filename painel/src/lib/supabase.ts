import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Lock simples in-memory baseado em Promise.
// Substitui o Web Locks API default do supabase-js (que estava travando
// 5s+ no carregamento da página em SPAs com várias chamadas paralelas).
let currentLock: Promise<unknown> = Promise.resolve()
function inMemoryLock<R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
  const next = currentLock.then(() => fn(), () => fn())
  currentLock = next.catch(() => {})
  return next
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: inMemoryLock,
  },
})
