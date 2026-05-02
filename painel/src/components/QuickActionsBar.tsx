import { Link } from 'react-router-dom'
import {
  FileSignature, Trophy, Handshake, Calendar, Users,
  Wallet, Megaphone, ClipboardCheck, Home, ArrowRight,
} from 'lucide-react'

const ACTIONS = [
  { label: 'Novo Imóvel',       to: '/painel/imoveis/novo',         icon: Home,            cor: 'bg-blue-500' },
  { label: 'Novo Contrato',     to: '/painel/contratos/novo',       icon: FileSignature,   cor: 'bg-indigo-500' },
  { label: 'Nova Venda',        to: '/painel/vendas/novo',          icon: Trophy,          cor: 'bg-amber-500' },
  { label: 'Nova Proposta',     to: '/painel/propostas/novo',       icon: Handshake,       cor: 'bg-purple-500' },
  { label: 'Novo Lead',         to: '/painel/leads',                icon: Users,           cor: 'bg-emerald-500' },
  { label: 'Agendar Visita',    to: '/painel/visitas',              icon: Calendar,        cor: 'bg-teal-500' },
  { label: 'Novo Proprietário', to: '/painel/proprietarios/novo',   icon: Wallet,          cor: 'bg-violet-500' },
  { label: 'Nova Vistoria',     to: '/painel/vistorias/novo',       icon: ClipboardCheck,  cor: 'bg-rose-500' },
  { label: 'Marketing',         to: '/painel/marketing',            icon: Megaphone,       cor: 'bg-pink-500' },
]

const QuickActionsBar = () => {
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Ações Rápidas
        </h2>
        <Link to="/painel/imoveis" className="inline-flex items-center gap-1 text-xs text-moradda-blue-600 hover:underline">
          Ver tudo <ArrowRight size={11} />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {ACTIONS.map((a) => (
          <Link key={a.to} to={a.to} className="group flex flex-col items-center gap-1.5 rounded-lg p-3 text-center transition hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <div className={`${a.cor} flex h-10 w-10 items-center justify-center rounded-full text-white transition group-hover:scale-110`}>
              <a.icon size={18} />
            </div>
            <span className="text-[11px] leading-tight font-medium text-gray-700 dark:text-gray-300">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default QuickActionsBar
