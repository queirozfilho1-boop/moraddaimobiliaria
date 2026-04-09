import { useState, useEffect } from 'react'
import { UserCog, UserPlus, Shield, Users, Loader2, Briefcase, Pencil, Trash2, X, Save } from 'lucide-react'
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

type Tab = 'corretores' | 'gestores' | 'administrativo'

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Administrativo (acesso total)',
  gestor: 'Gestor (visão completa, relatórios)',
  corretor: 'Corretor (acesso limitado)',
}

const ROLE_DISPLAY: Record<string, string> = {
  superadmin: 'Administrador',
  gestor: 'Gestor',
  corretor: 'Corretor',
}

export default function AcessosPage() {
  const [tab, setTab] = useState<Tab>('corretores')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<{ id: string; nome: string }[]>([])

  // Novo usuário
  const [showNovo, setShowNovo] = useState(false)
  const [novoForm, setNovoForm] = useState({ nome: '', email: '', telefone: '', whatsapp: '', creci: '', senha: '', role_id: '' })
  const [salvando, setSalvando] = useState(false)

  // Editar usuário
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ nome: '', email: '', telefone: '', whatsapp: '', creci: '', role_id: '' })
  const [editSalvando, setEditSalvando] = useState(false)

  // Excluir usuário
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  function startEdit(u: Usuario) {
    setEditId(u.id)
    setEditForm({ nome: u.nome, email: u.email, telefone: u.telefone || '', whatsapp: u.whatsapp || '', creci: u.creci || '', role_id: u.role_id })
  }

  async function salvarEdicao() {
    if (!editId || !editForm.nome) return
    setEditSalvando(true)
    const { error } = await supabase.from('users_profiles').update({
      nome: editForm.nome,
      email: editForm.email,
      telefone: editForm.telefone || null,
      whatsapp: editForm.whatsapp || null,
      creci: editForm.creci || null,
      role_id: editForm.role_id,
    }).eq('id', editId)
    setEditSalvando(false)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Usuário atualizado!')
    setEditId(null)
    fetchUsuarios()
  }

  async function excluirUsuario() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const uid = deleteTarget.id

      // Verificar se tem imóveis vinculados (NOT NULL, não pode setar null)
      const { count: imoveisCount } = await supabase.from('imoveis').select('id', { count: 'exact', head: true }).eq('corretor_id', uid)
      if (imoveisCount && imoveisCount > 0) {
        toast.error(`Não é possível excluir: este usuário tem ${imoveisCount} imóvel(is) vinculado(s). Reatribua os imóveis antes de excluir.`)
        setDeleting(false)
        return
      }

      // Limpar referências FK que aceitam NULL
      await supabase.from('leads').update({ corretor_id: null }).eq('corretor_id', uid)
      await supabase.from('precos_referencia').update({ atualizado_por: null }).eq('atualizado_por', uid)
      await supabase.from('imoveis_revisoes').update({ revisor_id: null }).eq('revisor_id', uid)
      await supabase.from('leads_historico').update({ usuario_id: null }).eq('usuario_id', uid)
      await supabase.from('followups').update({ corretor_id: null }).eq('corretor_id', uid)
      await supabase.from('ptam_historico').update({ corretor_id: null }).eq('corretor_id', uid)
      await supabase.from('imoveis_documentos').update({ uploaded_by: null }).eq('uploaded_by', uid)
      await supabase.from('blog_posts').update({ autor_id: null }).eq('autor_id', uid)
      await supabase.from('distribuicao_leads').update({ ultimo_corretor_id: null }).eq('ultimo_corretor_id', uid)
      // Deletar registros vinculados
      await supabase.from('notificacoes').delete().eq('usuario_id', uid)
      await supabase.from('log_atividades').delete().eq('usuario_id', uid)
      await supabase.from('progresso_corretor').delete().eq('corretor_id', uid)
      await supabase.from('progresso_modulo').delete().eq('corretor_id', uid)
      await supabase.from('certificados').delete().eq('corretor_id', uid)
      // Deletar perfil
      const { error } = await supabase.from('users_profiles').delete().eq('id', uid)
      if (error) throw error
      toast.success('Usuário excluído!')
      setDeleteTarget(null)
      fetchUsuarios()
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setDeleting(false)
    }
  }

  const corretores = usuarios.filter(u => u.role_nome === 'corretor')
  const gestores = usuarios.filter(u => u.role_nome === 'gestor')
  const admins = usuarios.filter(u => u.role_nome === 'superadmin')
  const listaAtual = tab === 'corretores' ? corretores : tab === 'gestores' ? gestores : admins

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
            <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie corretores, gestores e administradores</p>
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
                    {ROLE_LABELS[r.nome] || r.nome}
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
          onClick={() => setTab('gestores')}
          className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition ${
            tab === 'gestores'
              ? 'bg-white text-moradda-blue-600 shadow-sm dark:bg-gray-700 dark:text-moradda-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Briefcase size={16} />
          Gestores ({gestores.length})
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
                  {editId === u.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input type="text" value={editForm.nome} onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} className={inputClass + ' !py-1.5'} />
                      </td>
                      <td className="px-4 py-3">
                        <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className={inputClass + ' !py-1.5'} />
                      </td>
                      <td className="px-4 py-3">
                        <input type="tel" value={editForm.telefone} onChange={e => setEditForm(f => ({ ...f, telefone: e.target.value }))} className={inputClass + ' !py-1.5'} />
                      </td>
                      {tab === 'corretores' && (
                        <td className="px-4 py-3">
                          <input type="text" value={editForm.creci} onChange={e => setEditForm(f => ({ ...f, creci: e.target.value }))} className={inputClass + ' !py-1.5'} />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <select value={editForm.role_id} onChange={e => setEditForm(f => ({ ...f, role_id: e.target.value }))} className={inputClass + ' !py-1.5'}>
                          {roles.map(r => <option key={r.id} value={r.id}>{ROLE_DISPLAY[r.nome] || r.nome}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={salvarEdicao} disabled={editSalvando} className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20" title="Salvar">
                            <Save size={16} />
                          </button>
                          <button onClick={() => setEditId(null)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" title="Cancelar">
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-moradda-blue-100 font-semibold text-moradda-blue-600 dark:bg-moradda-blue-900/40 dark:text-moradda-blue-300">
                            {u.nome.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-100">{u.nome}</p>
                            <p className="text-xs text-gray-400">{ROLE_DISPLAY[u.role_nome] || u.role_nome}</p>
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
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(u)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-moradda-blue-600 dark:text-gray-400 dark:hover:bg-gray-700" title="Editar">
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => toggleAtivo(u.id, u.ativo)}
                            className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                              u.ativo
                                ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20'
                                : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                            }`}
                          >
                            {u.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                          <button onClick={() => setDeleteTarget(u)} className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20" title="Excluir">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {listaAtual.length === 0 && (
                <tr>
                  <td colSpan={tab === 'corretores' ? 6 : 5} className="px-4 py-12 text-center text-sm text-gray-400">
                    Nenhum {tab === 'corretores' ? 'corretor' : tab === 'gestores' ? 'gestor' : 'administrador'} cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal confirmação de exclusão */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Excluir usuário
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Tem certeza que deseja excluir <strong>{deleteTarget.nome}</strong> ({deleteTarget.email})? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={excluirUsuario}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
