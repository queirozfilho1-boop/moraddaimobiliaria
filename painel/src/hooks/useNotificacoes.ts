import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface Notificacao {
  id: string
  usuario_id: string
  tipo: string
  titulo: string
  mensagem: string
  link?: string | null
  lida: boolean
  created_at: string
}

interface UseNotificacoesReturn {
  notificacoes: Notificacao[]
  naoLidas: number
  loading: boolean
  marcarLida: (id: string) => Promise<void>
  marcarTodasLidas: () => Promise<void>
}

export function useNotificacoes(): UseNotificacoesReturn {
  const { profile } = useAuth()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNotificacoes = useCallback(async () => {
    if (!profile?.id) return

    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('usuario_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (!error && data) {
        setNotificacoes(data as Notificacao[])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    fetchNotificacoes()

    // Poll every 30 seconds
    intervalRef.current = setInterval(fetchNotificacoes, 30000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchNotificacoes])

  const naoLidas = notificacoes.filter((n) => !n.lida).length

  const marcarLida = useCallback(
    async (id: string) => {
      if (!profile?.id) return

      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id)
        .eq('usuario_id', profile.id)

      if (!error) {
        setNotificacoes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, lida: true } : n)),
        )
      }
    },
    [profile?.id],
  )

  const marcarTodasLidas = useCallback(async () => {
    if (!profile?.id) return

    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('usuario_id', profile.id)
      .eq('lida', false)

    if (!error) {
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
    }
  }, [profile?.id])

  return { notificacoes, naoLidas, loading, marcarLida, marcarTodasLidas }
}
