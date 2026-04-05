import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Menu, Moon, Sun, Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
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

export default function PainelLayout() {
  const { user, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
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
            <button
              className="relative rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Notificacoes"
            >
              <Bell size={20} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
