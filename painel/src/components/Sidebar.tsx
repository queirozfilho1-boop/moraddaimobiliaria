import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  Calculator,
  UserCog,
  GraduationCap,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  FileSignature,
  Wallet,
  TrendingUp,
  Trophy,
  Handshake,
  Kanban,
  Calendar,
  Megaphone,
  ClipboardCheck,
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
  { label: 'Locacoes', path: '/painel/contratos', icon: <FileSignature size={20} /> },
  { label: 'Vendas', path: '/painel/vendas', icon: <Trophy size={20} /> },
  { label: 'Pipeline', path: '/painel/vendas/pipeline', icon: <Kanban size={20} /> },
  { label: 'Propostas', path: '/painel/propostas', icon: <Handshake size={20} /> },
  { label: 'Financeiro', path: '/painel/financeiro', icon: <TrendingUp size={20} /> },
  { label: 'Proprietarios', path: '/painel/proprietarios', icon: <Wallet size={20} /> },
  { label: 'Modelos Contrato', path: '/painel/modelos-contrato', icon: <FileSignature size={20} /> },
  { label: 'Leads', path: '/painel/leads', icon: <Users size={20} /> },
  { label: 'Pipeline Leads', path: '/painel/leads/pipeline', icon: <Kanban size={20} /> },
  { label: 'Visitas', path: '/painel/visitas', icon: <Calendar size={20} /> },
  { label: 'Vistorias', path: '/painel/vistorias', icon: <ClipboardCheck size={20} /> },
  { label: 'Marketing', path: '/painel/marketing', icon: <Megaphone size={20} /> },
  { label: 'Precificacao', path: '/painel/precificacao', icon: <Calculator size={20} /> },
  { label: 'CRM', path: '/painel/crm', icon: <LayoutDashboard size={20} />, superadminOnly: true },
  { label: 'Aprendizado', path: '/painel/aprendizado', icon: <GraduationCap size={20} /> },
  { label: 'Acessos', path: '/painel/acessos', icon: <UserCog size={20} />, superadminOnly: true },
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
          <Link
            to="/painel/perfil"
            className="group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moradda-gold-400 text-sm font-bold text-moradda-blue-900 transition hover:ring-2 hover:ring-moradda-gold-400/50"
            title="Editar perfil"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              profile?.nome?.charAt(0)?.toUpperCase() || 'U'
            )}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-moradda-blue-900 opacity-0 shadow transition group-hover:opacity-100">
              <Pencil size={10} />
            </span>
          </Link>
          {!collapsed && (
            <Link to="/painel/perfil" className="min-w-0 flex-1 group" title="Editar perfil">
              <p className="truncate text-sm font-medium text-white group-hover:text-moradda-gold-400 transition">
                {profile?.nome || 'Usuario'}
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-white/50 group-hover:text-moradda-gold-400/70 transition">
                <Pencil size={10} />
                Editar perfil
              </span>
            </Link>
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
