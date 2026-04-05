import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  Calculator,
  UserCog,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import logoImg from '@/assets/logo.png'
import { useTheme } from '@/contexts/ThemeContext'

interface NavItem {
  label: string
  path: string
  icon: ReactNode
  superadminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/painel/', icon: <LayoutDashboard size={20} /> },
  { label: 'Imoveis', path: '/painel/imoveis', icon: <Building2 size={20} /> },
  { label: 'Leads', path: '/painel/leads', icon: <Users size={20} /> },
  { label: 'Precificacao', path: '/painel/precificacao', icon: <Calculator size={20} /> },
  { label: 'Corretores', path: '/painel/corretores', icon: <UserCog size={20} />, superadminOnly: true },
]

const SIDEBAR_KEY = 'moradda_painel_sidebar'

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { profile, signOut, hasAccess } = useAuth()
  const { theme } = useTheme()
  const location = useLocation()

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SIDEBAR_KEY) === 'collapsed'
    }
    return false
  })

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? 'collapsed' : 'expanded')
  }, [collapsed])

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileClose()
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredItems = navItems.filter((item) => {
    if (item.superadminOnly) return hasAccess('superadmin')
    return true
  })

  const sidebarWidth = collapsed ? 'w-16' : 'w-64'

  const sidebarContent = (
    <div
      className={`flex h-full flex-col bg-moradda-blue-900 text-white ${
        theme === 'dark' ? 'bg-moradda-blue-950' : ''
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {!collapsed ? (
          <img src={logoImg} alt="Moradda" className="h-9 w-auto brightness-0 invert" />
        ) : (
          <img src={logoImg} alt="Moradda" className="h-8 w-auto brightness-0 invert mx-auto" />
        )}
        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded p-1 text-white/60 transition hover:bg-white/10 hover:text-white lg:block"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        {/* Close button (mobile only) */}
        <button
          onClick={onMobileClose}
          className="rounded p-1 text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {filteredItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/painel/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'border-l-3 border-moradda-gold-400 bg-white/10 text-moradda-gold-400'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`
                }
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User profile section */}
      <div className="border-t border-white/10 p-4">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moradda-gold-400 text-sm font-bold text-moradda-blue-900">
            {profile?.nome?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {profile?.nome || 'Usuario'}
              </p>
              <span className="inline-block rounded bg-moradda-gold-400/20 px-1.5 py-0.5 text-xs text-moradda-gold-400">
                {profile?.role === 'superadmin' ? 'Admin' : 'Corretor'}
              </span>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              className="rounded p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden transition-all duration-300 lg:block ${sidebarWidth}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
