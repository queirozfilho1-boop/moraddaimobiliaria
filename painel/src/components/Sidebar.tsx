import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
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
  Home,
  Briefcase,
  Palette,
  MapPin,
  Settings,
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

interface NavGroup {
  label: string
  items: NavItem[]
}

const groups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard',  path: '/painel/',          icon: <LayoutDashboard size={18} /> },
      { label: 'Financeiro', path: '/painel/financeiro', icon: <TrendingUp size={18} /> },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { label: 'CRM',            path: '/painel/crm',             icon: <Briefcase size={18} />, superadminOnly: true },
      { label: 'Leads',          path: '/painel/leads',           icon: <Users size={18} /> },
      { label: 'Pipeline Leads', path: '/painel/leads/pipeline',  icon: <Kanban size={18} /> },
      { label: 'Visitas',        path: '/painel/visitas',         icon: <Calendar size={18} /> },
      { label: 'Propostas',      path: '/painel/propostas',       icon: <Handshake size={18} /> },
      { label: 'Vendas',         path: '/painel/vendas',          icon: <Trophy size={18} /> },
      { label: 'Pipeline Vendas',path: '/painel/vendas/pipeline', icon: <Kanban size={18} /> },
    ],
  },
  {
    label: 'Locação',
    items: [
      { label: 'Contratos',        path: '/painel/contratos',         icon: <FileSignature size={18} /> },
      { label: 'Vistorias',        path: '/painel/vistorias',         icon: <ClipboardCheck size={18} /> },
      { label: 'Modelos Contrato', path: '/painel/modelos-contrato',  icon: <FileSignature size={18} /> },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { label: 'Imóveis',        path: '/painel/imoveis',        icon: <Home size={18} /> },
      { label: 'Proprietários',  path: '/painel/proprietarios',  icon: <Wallet size={18} /> },
      { label: 'Bairros',        path: '/painel/bairros',        icon: <MapPin size={18} /> },
      { label: 'Corretores',     path: '/painel/corretores',     icon: <Briefcase size={18} /> },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Marketing',  path: '/painel/marketing',   icon: <Megaphone size={18} /> },
      { label: 'Banners',    path: '/painel/banners',     icon: <Palette size={18} /> },
      { label: 'Blog',       path: '/painel/blog',        icon: <Megaphone size={18} /> },
      { label: 'Depoimentos',path: '/painel/depoimentos', icon: <Users size={18} /> },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Precificação', path: '/painel/precificacao', icon: <Calculator size={18} /> },
      { label: 'Aprendizado',  path: '/painel/aprendizado',  icon: <GraduationCap size={18} /> },
      { label: 'Acessos',      path: '/painel/acessos',      icon: <UserCog size={18} />,   superadminOnly: true },
      { label: 'Relatórios',   path: '/painel/relatorios',   icon: <TrendingUp size={18} /> },
      { label: 'Configurações',path: '/painel/configuracoes',icon: <Settings size={18} /> },
    ],
  },
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

  useEffect(() => {
    onMobileClose()
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredGroups = groups.map((g) => ({
    ...g,
    items: g.items.filter((item) => !item.superadminOnly || hasAccess('superadmin')),
  })).filter((g) => g.items.length > 0)

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
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded p-1 text-white/60 transition hover:bg-white/10 hover:text-white lg:block"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <button
          onClick={onMobileClose}
          className="rounded p-1 text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {filteredGroups.map((group) => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <div className="px-4 pt-3 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-moradda-gold-400/70">
                  {group.label}
                </span>
              </div>
            )}
            {collapsed && <div className="my-2 mx-3 border-t border-white/5" />}
            <ul className="space-y-0.5 px-2">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/painel/'}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'bg-white/10 text-moradda-gold-400 border-l-2 border-moradda-gold-400 pl-2.5'
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
          </div>
        ))}
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
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden transition-all duration-300 lg:block ${sidebarWidth}`}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

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
