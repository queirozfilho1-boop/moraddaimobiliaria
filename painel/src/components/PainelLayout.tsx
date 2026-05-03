import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Menu, Moon, Sun, Bell, Check, CheckCheck } from 'lucide-react'
import { Toaster } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useNotificacoes } from '@/hooks/useNotificacoes'
import Sidebar from '@/components/Sidebar'

const pageTitles: Record<string, string> = {
  '/painel/': 'Dashboard',
  '/painel/imoveis': 'Imoveis',
  '/painel/imoveis/novo': 'Novo Imovel',
  '/painel/leads': 'Leads',
  '/painel/precificacao': 'Precificacao',
  '/painel/blog': 'Blog',
  '/painel/bairros': 'Bairros',
  '/painel/depoimentos': 'Depoimentos',
  '/painel/banners': 'Banners',
  '/painel/corretores': 'Corretores',
  '/painel/relatorios': 'Relatorios',
  '/painel/configuracoes': 'Configuracoes',
}

function timeAgoShort(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}d`
}

export default function PainelLayout() {
  const { user, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas } = useNotificacoes()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('moradda_painel_sidebar') === 'collapsed'
    }
    return false
  })

  // Sync sidebar collapsed state
  useEffect(() => {
    const handleStorage = () => {
      setSidebarCollapsed(
        localStorage.getItem('moradda_painel_sidebar') === 'collapsed',
      )
    }
    window.addEventListener('storage', handleStorage)

    // Also poll for local changes (same tab)
    const interval = setInterval(() => {
      const current =
        localStorage.getItem('moradda_painel_sidebar') === 'collapsed'
      setSidebarCollapsed(current)
    }, 200)

    return () => {
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [])

  // Close notification dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close notification dropdown on route change
  useEffect(() => {
    setNotifOpen(false)
  }, [location.pathname])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-moradda-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/painel/login" replace />
  }

  const pageTitle =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith('/painel/imoveis/')
      ? 'Editar Imovel'
      : 'Painel')

  const marginLeft = sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className={`flex min-h-screen flex-col transition-all duration-300 ${marginLeft}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {pageTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                aria-label="Notificacoes"
              >
                <Bell size={20} />
                {naoLidas > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {naoLidas > 9 ? '9+' : naoLidas}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:w-96">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      Notificacoes
                    </h4>
                    {naoLidas > 0 && (
                      <button
                        onClick={() => marcarTodasLidas()}
                        className="flex items-center gap-1 text-xs text-moradda-blue-500 transition hover:text-moradda-blue-600"
                      >
                        <CheckCheck size={14} />
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notificacoes.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                        Nenhuma notificacao.
                      </p>
                    ) : (
                      notificacoes.slice(0, 15).map((n) => (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 border-b border-gray-50 px-4 py-3 transition last:border-0 hover:bg-gray-50 dark:border-gray-700/50 dark:hover:bg-gray-700/40 ${
                            !n.lida ? 'bg-moradda-blue-50/50 dark:bg-moradda-blue-900/10' : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            {n.link ? (
                              <Link
                                to={n.link}
                                className="text-sm font-medium text-gray-800 hover:text-moradda-blue-500 dark:text-gray-200"
                                onClick={() => {
                                  if (!n.lida) marcarLida(n.id)
                                  setNotifOpen(false)
                                }}
                              >
                                {n.titulo}
                              </Link>
                            ) : (
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {n.titulo}
                              </p>
                            )}
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                              {n.mensagem}
                            </p>
                            <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                              {timeAgoShort(n.created_at)}
                            </p>
                          </div>
                          {!n.lida && (
                            <button
                              onClick={() => marcarLida(n.id)}
                              className="mt-1 shrink-0 rounded p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300"
                              title="Marcar como lida"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Toasts globais (success/error/info) — theme fixo evita re-render */}
      <Toaster richColors position="top-right" closeButton />
    </div>
  )
}
