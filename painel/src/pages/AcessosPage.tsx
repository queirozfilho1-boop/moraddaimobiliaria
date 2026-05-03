import { useState, useEffect } from 'react'
import { UserCog, UserPlus, Crown, Briefcase, Award, Loader2, Pencil, Trash2, X, Save, CheckCircle2 } from 'lucide-react'
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
  is_socio: boolean
  is_assistente: boolean
  is_corretor: boolean
  created_at: string
}

type Tab = 'todos' | 'socios' | 'assistentes' | 'corretores'

interface FuncoesForm {
  is_socio: boolean
  is_assistente: boolean
  is_corretor: boolean
}

export default function AcessosPage() {
  const [tab, setTab] = useState<Tab>('todos')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)

  // Novo usuário
  const [showNovo, setShowNovo] = useState(false)
  const [novoForm, setNovoForm] = useState({
    nome: '', email: '', telefone: '', whatsapp: '', creci: '', senha: '',
    is_socio: false, is_assistente: false, is_corretor: false,
  })
  const [salvando, setSalvando] = useState(false)

  // Editar usuário
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{
    nome: string; email: string; telefone: string; whatsapp: string; creci: string
  } & FuncoesForm>({
    nome: '', email: '', telefone: '', whatsapp: '', creci: '',
    is_socio: false, is_assistente: false, is_corretor: false,
  })
  const [editSalvando, setEditSalvando] = useState(false)

  // Excluir usuário
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchUsuarios()
  }, [])

  async function fetchUsuarios() {
    setLoading(true)
    const { data, error } = await supabase
      .from('users_profiles')
      .select('id, nome, email, telefone, whatsapp, creci, slug, ativo, is_socio, is_assistente, is_corretor, created_at')
      .order('nome')

    if (error) {
      toast.error('Erro ao carregar usuários: ' + error.message)
      setLoading(false)
      return
    }

    setUsuarios((data || []) as Usuario[])
    setLoading(false)
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    const { error } = await supabase.from('users_profiles').update({ ativo: !ativo }).eq('id', id)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success(ativo ? 'Usuário desativado' : 'Usuário ativado')
    fetchUsuarios()
  }

  async function criarUsuario() {
    if (!novoForm.nome || !novoForm.email || !novoForm.senha) {
      toast.error('Preencha nome, e-mail e senha')
      return
    }
    if (!novoForm.is_socio && !novoForm.is_assistente && !novoForm.is_corretor) {
      toast.error('Selecione ao menos uma função')
      return
    }
    setSalvando(true)

    // 1. Criar no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: novoForm.email,
      password: novoForm.senha,
    })

    if (authError || !authData.user) {
      toast.error('Erro ao criar: ' + (authError?.message || 'Erro desconhecido'))
      setSalvando(false)
      return
    }

    // 2. Criar perfil — trigger sync_role_from_funcoes ajusta role_id automaticamente
    const slug = novoForm.nome.normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
    const { error: profileError } = await supabase.from('users_profiles').insert({
      user_id: authData.user.id,
      nome: novoForm.nome,
      email: novoForm.email,
      telefone: novoForm.telefone || null,
      whatsapp: novoForm.whatsapp || null,
      creci: novoForm.creci || null,
      slug: slug + '-' + Date.now().toString(36),
      is_socio: novoForm.is_socio,
      is_assistente: novoForm.is_assistente,
      is_corretor: novoForm.is_corretor,
      ativo: true,
    })

    setSalvando(false)
    if (profileError) {
      toast.error('Erro ao criar perfil: ' + profileError.message)
      return
    }

    toast.success('Usuário criado!')
    setNovoForm({ nome: '', email: '', telefone: '', whatsapp: '', creci: '', senha: '', is_socio: false, is_assistente: false, is_corretor: false })
    setShowNovo(false)
    fetchUsuarios()
  }

  function startEdit(u: Usuario) {
    setEditId(u.id)
    setEditForm({
      nome: u.nome, email: u.email, telefone: u.telefone || '', whatsapp: u.whatsapp || '', creci: u.creci || '',
      is_socio: u.is_socio, is_assistente: u.is_assistente, is_corretor: u.is_corretor,
    })
  }

  async function salvarEdicao() {
    if (!editId || !editForm.nome) return
    if (!editForm.is_socio && !editForm.is_assistente && !editForm.is_corretor) {
      toast.error('Selecione ao menos uma função')
      return
    }
    setEditSalvando(true)
    const { error } = await supabase.from('users_profiles').update({
      nome: editForm.nome,
      email: editForm.email,
      telefone: editForm.telefone || null,
      whatsapp: editForm.whatsapp || null,
      creci: editForm.creci || null,
      is_socio: editForm.is_socio,
      is_assistente: editForm.is_assistente,
      is_corretor: editForm.is_corretor,
    }).eq('id', editId)
    setEditSalvando(false)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Atualizado!')
    setEditId(null)
    fetchUsuarios()
  }

  async function excluirUsuario() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const uid = deleteTarget.id
      const { data: imoveisVinculados } = await supabase.from('imoveis').select('id').eq('corretor_id', uid)
      if (imoveisVinculados && imoveisVinculados.length > 0) {
        toast.error(`Tem ${imoveisVinculados.length} imóvel(is) vinculado(s). Reatribua antes.`)
        setDeleting(false); setDeleteTarget(null); return
      }
      const { error: rpcError } = await supabase.rpc('excluir_usuario_completo', { p_user_profile_id: uid })
      if (rpcError) throw rpcError
      toast.success('Excluído!')
      setDeleteTarget(null)
      fetchUsuarios()
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setDeleting(false)
    }
  }

  const filtroPorTab: Record<Tab, (u: Usuario) => boolean> = {
    todos: () => true,
    socios: (u) => u.is_socio,
    assistentes: (u) => u.is_assistente,
    corretores: (u) => u.is_corretor,
  }
  const listaAtual = usuarios.filter(filtroPorTab[tab])

  const counts = {
    todos: usuarios.length,
    socios: usuarios.filter(u => u.is_socio).length,
    assistentes: usuarios.filter(u => u.is_assistente).length,
    corretores: usuarios.filter(u => u.is_corretor).length,
  }

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-moradda-blue-100 text-moradda-blue-600 dark:bg-moradda-blue-900/40 dark:text-moradda-blue-400">
            <UserCog className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Acessos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cada pessoa pode acumular Sócio · Assistente · Corretor</p>
          </div>
        </div>
        <button
          onClick={() => setShowNovo(!showNovo)}
          className="inline-flex items-center gap-2 rounded-lg bg-moradda-gold-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moradda-gold-600"
        >
          <UserPlus size={18} /> Novo Usuário
        </button>
      </div>

      {/* Novo */}
      {showNovo && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Cadastrar Novo Usuário</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Nome completo *</label>
              <input value={novoForm.nome} onChange={e => setNovoForm(p => ({ ...p, nome: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">E-mail *</label>
              <input type="email" value={novoForm.email} onChange={e => setNovoForm(p => ({ ...p, email: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Senha *</label>
              <input type="password" value={novoForm.senha} onChange={e => setNovoForm(p => ({ ...p, senha: e.target.value }))} className={inputClass} placeholder="Mínimo 6" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Telefone</label>
              <input type="tel" value={novoForm.telefone} onChange={e => setNovoForm(p => ({ ...p, telefone: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">WhatsApp</label>
              <input type="tel" value={novoForm.whatsapp} onChange={e => setNovoForm(p => ({ ...p, whatsapp: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">CRECI</label>
              <input value={novoForm.creci} onChange={e => setNovoForm(p => ({ ...p, creci: e.target.value }))} className={inputClass} placeholder="00000-RJ" />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-400">Funções *</label>
              <div className="flex flex-wrap gap-2">
                <FuncaoCheckbox label="Sócio" desc="Acesso total" icon={<Crown size={14}/>} checked={novoForm.is_socio} onChange={(v: boolean) => setNovoForm(p => ({ ...p, is_socio: v }))} />
                <FuncaoCheckbox label="Assistente Geral" desc="Operacional" icon={<Briefcase size={14}/>} checked={novoForm.is_assistente} onChange={(v: boolean) => setNovoForm(p => ({ ...p, is_assistente: v }))} />
                <FuncaoCheckbox label="Corretor" desc="Vende e capta" icon={<Award size={14}/>} checked={novoForm.is_corretor} onChange={(v: boolean) => setNovoForm(p => ({ ...p, is_corretor: v }))} />
              </div>
            </div>

            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
              <button onClick={criarUsuario} disabled={salvando}
                className="rounded-lg bg-moradda-blue-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-moradda-blue-600 disabled:opacity-50">
                {salvando ? 'Criando...' : 'Criar'}
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
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800 overflow-x-auto">
        {([
          ['todos', 'Todos', null],
          ['socios', 'Sócios', <Crown size={14} key="c"/>],
          ['assistentes', 'Assistentes', <Briefcase size={14} key="b"/>],
          ['corretores', 'Corretores', <Award size={14} key="a"/>],
        ] as const).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={`flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
              tab === key
                ? 'bg-white text-moradda-blue-600 shadow-sm dark:bg-gray-700 dark:text-moradda-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            {icon}
            {label} ({counts[key]})
          </button>
        ))}
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
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">CRECI</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Funções</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {listaAtual.map(u => (
                <tr key={u.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  {editId === u.id ? (
                    <>
                      <td className="px-4 py-3"><input value={editForm.nome} onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} className={inputClass + ' !py-1.5'} /></td>
                      <td className="px-4 py-3"><input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className={inputClass + ' !py-1.5'} /></td>
                      <td className="px-4 py-3"><input type="tel" value={editForm.telefone} onChange={e => setEditForm(f => ({ ...f, telefone: e.target.value }))} className={inputClass + ' !py-1.5'} /></td>
                      <td className="px-4 py-3"><input value={editForm.creci} onChange={e => setEditForm(f => ({ ...f, creci: e.target.value }))} className={inputClass + ' !py-1.5'} /></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <MiniCheck label="Sócio" checked={editForm.is_socio} onChange={(v: boolean) => setEditForm(f => ({ ...f, is_socio: v }))} />
                          <MiniCheck label="Assist" checked={editForm.is_assistente} onChange={(v: boolean) => setEditForm(f => ({ ...f, is_assistente: v }))} />
                          <MiniCheck label="Corretor" checked={editForm.is_corretor} onChange={(v: boolean) => setEditForm(f => ({ ...f, is_corretor: v }))} />
                        </div>
                      </td>
                      <td className="px-4 py-3">—</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={salvarEdicao} disabled={editSalvando} className="rounded-lg p-1.5 text-green-600 hover:bg-green-50" title="Salvar"><Save size={16}/></button>
                          <button onClick={() => setEditId(null)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" title="Cancelar"><X size={16}/></button>
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
                          <p className="font-medium text-gray-800 dark:text-gray-100">{u.nome}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.telefone || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.creci || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.is_socio && <Badge color="amber" icon={<Crown size={10}/>}>Sócio</Badge>}
                          {u.is_assistente && <Badge color="blue" icon={<Briefcase size={10}/>}>Assistente</Badge>}
                          {u.is_corretor && <Badge color="emerald" icon={<Award size={10}/>}>Corretor</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          u.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(u)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-moradda-blue-600" title="Editar"><Pencil size={15}/></button>
                          <button onClick={() => toggleAtivo(u.id, u.ativo)} className={`rounded-lg px-2 py-1.5 text-xs font-medium ${u.ativo ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}>
                            {u.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                          <button onClick={() => setDeleteTarget(u)} className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600" title="Excluir"><Trash2 size={15}/></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {listaAtual.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">Nenhum usuário nesta categoria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Excluir */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Excluir usuário</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Excluir <strong>{deleteTarget.nome}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={excluirUsuario} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const FuncaoCheckbox = ({ label, desc, icon, checked, onChange }: any) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`flex items-start gap-2 rounded-lg border-2 p-3 transition text-left ${
      checked
        ? 'border-moradda-blue-500 bg-moradda-blue-50 dark:bg-moradda-blue-900/30'
        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800'
    }`}
  >
    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
      checked ? 'bg-moradda-blue-500 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'
    }`}>
      {checked ? <CheckCircle2 size={16}/> : icon}
    </div>
    <div>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
    </div>
  </button>
)

const MiniCheck = ({ label, checked, onChange }: any) => (
  <label className={`inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[10px] font-medium ${
    checked ? 'bg-moradda-blue-100 text-moradda-blue-700' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
  }`}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="hidden" />
    {checked && <CheckCircle2 size={10}/>}
    {label}
  </label>
)

const Badge = ({ color, icon, children }: any) => {
  const cls: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cls[color]}`}>
      {icon}
      {children}
    </span>
  )
}
