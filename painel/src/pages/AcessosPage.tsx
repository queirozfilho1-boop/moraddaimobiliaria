import { useState, useEffect } from 'react'
import { UserCog, UserPlus, Shield, Users, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface Usuario {
  id: string
  nome: string
  email: string
  telefone: string | null
  whatsapp: string | null
  creci: string | null
  slug: string
  ativo: boolean
  role_id: string
  role_nome: string
  created_at: string
}

type Tab = 'corretores' | 'administrativo'

export default function AcessosPage() {
  const [tab, setTab] = useState<Tab>('corretores')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<{ id: string; nome: string }[]>([])

  // Novo usuário
  const [showNovo, setShowNovo] = useState(false)
  const [novoForm, setNovoForm] = useState({ nome: '', email: '', telefone: '', whatsapp: '', creci: '', senha: '', role_id: '' })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    fetchUsuarios()
    fetchRoles()
  }, [])

  async function fetchRoles() {
    const { data } = await supabase.from('roles').select('id, nome').order('nome')
    setRoles(data || [])
  }

  async function fetchUsuarios() {
    setLoading(true)
    const { data, error } = await supabase
      .from('users_profiles')
      .select('id, nome, email, telefone, whatsapp, creci, slug, ativo, role_id, created_at, roles(nome)')
      .order('nome')

    if (error) {
      toast.error('Erro ao carregar usuários')
      setLoading(false)
      return
    }

    const mapped = (data || []).map((u: any) => ({
      ...u,
      role_nome: u.roles?.nome || 'sem role',
    }))
    setUsuarios(mapped)
    setLoading(false)
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    const { error } = await supabase.from('users_profiles').update({ ativo: !ativo }).eq('id', id)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success(ativo ? 'Usuário desativado' : 'Usuário ativado')
    fetchUsuarios()
  }

  async function criarUsuario() {
    if (!novoForm.nome || !novoForm.email || !novoForm.senha || !novoForm.role_id) {
      toast.error('Preencha nome, email, senha e tipo de acesso')
      return
    }
    setSalvando(true)

    // 1. Criar no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: novoForm.email,
      password: novoForm.senha,
    })

    if (authError || !authData.user) {
      toast.error('Erro ao criar usuário: ' + (authError?.message || 'Erro desconhecido'))
      setSalvando(false)
      return
    }

    // 2. Criar perfil
    const slug = novoForm.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
    const { error: profileError } = await supabase.from('users_profiles').insert({
      user_id: authData.user.id,
      nome: novoForm.nome,
      email: novoForm.email,
      telefone: novoForm.telefone || null,
      whatsapp: novoForm.whatsapp || null,
      creci: novoForm.creci || null,
      slug: slug + '-' + Date.now().toString(36),
      role_id: novoForm.role_id,
      ativo: true,
    })

    setSalvando(false)
    if (profileError) {
      toast.error('Erro ao criar perfil: ' + profileError.message)
      return
    }

    toast.success('Usuário criado com sucesso!')
    setNovoForm({ nome: '', email: '', telefone: '', whatsapp: '', creci: '', senha: '', role_id: '' })
    setShowNovo(false)
    fetchUsuarios()
  }

  const corretores = usuarios.filter(u => u.role_nome === 'corretor')
  const admins = usuarios.filter(u => u.role_nome === 'superadmin')
  const listaAtual = tab === 'corretores' ? corretores : admins

  const inputClass = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-moradda-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-moradda-blue-100 text-moradda-blue-600 dark:bg-moradda-blue-900/40 dark:text-moradda-blue-400">
            <UserCog className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Acessos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie corretores e administradores</p>
          </div>
        </div>
        <button
          onClick={() => setShowNovo(!showNovo)}
          className="inline-flex items-center gap-2 rounded-lg bg-moradda-gold-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moradda-gold-600"
        >
          <UserPlus size={18} />
          Novo Usuário
        </button>
      </div>

      {/* Novo Usuário */}
      {showNovo && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Cadastrar Novo Usuário</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Nome completo *</label>
              <input type="text" value={novoForm.nome} onChange={e => setNovoForm(p => ({ ...p, nome: e.target.value }))} className={inputClass} placeholder="Nome do usuário" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">E-mail *</label>
              <input type="email" value={novoForm.email} onChange={e => setNovoForm(p => ({ ...p, email: e.target.value }))} className={inputClass} placeholder="email@exemplo.com" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Senha *</label>
              <input type="password" value={novoForm.senha} onChange={e => setNovoForm(p => ({ ...p, senha: e.target.value }))} className={inputClass} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Telefone</label>
              <input type="tel" value={novoForm.telefone} onChange={e => setNovoForm(p => ({ ...p, telefone: e.target.value }))} className={inputClass} placeholder="(24) 99999-0000" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">WhatsApp</label>
              <input type="tel" value={novoForm.whatsapp} onChange={e => setNovoForm(p => ({ ...p, whatsapp: e.target.value }))} className={inputClass} placeholder="5524999990000" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">CRECI</label>
              <input type="text" value={novoForm.creci} onChange={e => setNovoForm(p => ({ ...p, creci: e.target.value }))} className={inputClass} placeholder="00000-RJ" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Tipo de Acesso *</label>
              <select value={novoForm.role_id} onChange={e => setNovoForm(p => ({ ...p, role_id: e.target.value }))} className={inputClass}>
                <option value="">Selecione...</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.nome === 'superadmin' ? 'Administrativo (acesso total)' : 'Corretor (acesso limitado)'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2">
              <button onClick={criarUsuario} disabled={salvando}
                className="rounded-lg bg-moradda-blue-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-moradda-blue-600 disabled:opacity-50">
                {salvando ? 'Criando...' : 'Criar Usuário'}
              </button>
              <button onClick={() => setShowNovo(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        <button
          onClick={() => setTab('corretores')}
          className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition ${
            tab === 'corretores'
              ? 'bg-white text-moradda-blue-600 shadow-sm dark:bg-gray-700 dark:text-moradda-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Users size={16} />
          Corretores ({corretores.length})
        </button>
        <button
          onClick={() => setTab('administrativo')}
          className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition ${
            tab === 'administrativo'
              ? 'bg-white text-moradda-blue-600 shadow-sm dark:bg-gray-700 dark:text-moradda-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Shield size={16} />
          Administrativo ({admins.length})
        </button>
      </div>

      {/* Lista */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Usuário</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">E-mail</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Telefone</th>
                {tab === 'corretores' && <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">CRECI</th>}
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {listaAtual.map(u => (
                <tr key={u.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-moradda-blue-100 font-semibold text-moradda-blue-600 dark:bg-moradda-blue-900/40 dark:text-moradda-blue-300">
                        {u.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">{u.nome}</p>
                        <p className="text-xs text-gray-400">{u.role_nome === 'superadmin' ? 'Administrador' : 'Corretor'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.telefone || '—'}</td>
                  {tab === 'corretores' && <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.creci || '—'}</td>}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.ativo
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    }`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAtivo(u.id, u.ativo)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        u.ativo
                          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                          : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                      }`}
                    >
                      {u.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
              {listaAtual.length === 0 && (
                <tr>
                  <td colSpan={tab === 'corretores' ? 6 : 5} className="px-4 py-12 text-center text-sm text-gray-400">
                    Nenhum {tab === 'corretores' ? 'corretor' : 'administrador'} cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
