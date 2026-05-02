import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Save, Loader2, User, Trash2, Pencil, Search,
  Wallet, Zap, AlertCircle, CheckCircle2, ExternalLink, FileText,
} from 'lucide-react'
import { gerarInformeIR } from '@/lib/informeIR'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const SUPA_FN = `${import.meta.env.VITE_SUPABASE_URL || 'https://mvzjqktgnwjwuinnxxcc.supabase.co'}/functions/v1`

interface Proprietario {
  id: string
  nome: string
  cpf_cnpj?: string | null
  email?: string | null
  telefone?: string | null
  rg?: string | null
  data_nascimento?: string | null
  estado_civil?: string | null
  profissao?: string | null
  endereco?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
  banco?: string | null
  agencia?: string | null
  conta?: string | null
  conta_tipo?: string | null
  pix_chave?: string | null
  pix_tipo?: string | null
  asaas_account_id?: string | null
  asaas_wallet_id?: string | null
  repasse_modo: 'split' | 'transfer' | 'manual'
  ativo: boolean
  observacoes?: string | null
}

const REPASSE_LABEL: Record<string, string> = {
  split:    'Split (direto via Asaas)',
  transfer: 'Transferência (passa pela Moradda)',
  manual:   'Manual',
}

export const ProprietariosListPage = () => {
  const [rows, setRows] = useState<Proprietario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [del, setDel] = useState<Proprietario | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('proprietarios').select('*').order('nome')
    setRows((data || []) as Proprietario[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = rows.filter((r) => {
    if (!search) return true
    const s = search.toLowerCase()
    return `${r.nome} ${r.cpf_cnpj || ''} ${r.email || ''}`.toLowerCase().includes(s)
  })

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Proprietários</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Cadastro de proprietários e configuração de repasse.</p>
        </div>
        <Link to="/painel/proprietarios/novo" className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600">
          <Plus size={15} />
          Novo Proprietário
        </Link>
      </div>

      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <User size={40} className="mx-auto text-gray-400" />
          <h3 className="mt-4 text-base font-semibold text-gray-700 dark:text-gray-200">
            {rows.length === 0 ? 'Nenhum proprietário cadastrado' : 'Nada encontrado'}
          </h3>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-left font-medium">CPF/CNPJ</th>
                <th className="px-4 py-3 text-left font-medium">Contato</th>
                <th className="px-4 py-3 text-left font-medium">Modo Repasse</th>
                <th className="px-4 py-3 text-left font-medium">Asaas</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{r.nome}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.cpf_cnpj || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    <div>{r.email || '—'}</div>
                    <div>{r.telefone || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                      {r.repasse_modo === 'split' && <Zap size={11} />}
                      {r.repasse_modo === 'transfer' && <Wallet size={11} />}
                      {REPASSE_LABEL[r.repasse_modo]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {r.asaas_wallet_id ? (
                      <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300">
                        <CheckCircle2 size={12} /> Subconta
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/painel/proprietarios/${r.id}`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-moradda-blue-600 dark:hover:bg-gray-700">
                        <Pencil size={15} />
                      </Link>
                      <button onClick={() => setDel(r)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {del && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDel(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Excluir proprietário</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Remover <strong>{del.nome}</strong>? Imóveis vinculados serão desligados.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDel(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">Cancelar</button>
              <button onClick={async () => {
                await supabase.from('proprietarios').delete().eq('id', del.id)
                setDel(null); load()
                toast.success('Removido')
              }} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const ProprietarioEditorPage = () => {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'novo'
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [p, setP] = useState<Partial<Proprietario>>({
    nome: '', repasse_modo: 'transfer', ativo: true, nacionalidade: 'Brasileira',
  } as any)

  useEffect(() => {
    if (isNew) return
    ;(async () => {
      const { data } = await supabase.from('proprietarios').select('*').eq('id', id).single()
      if (data) setP(data)
      setLoading(false)
    })()
  }, [id, isNew])

  async function save() {
    if (!p.nome) { toast.error('Defina o nome'); return }
    setSaving(true)
    if (isNew) {
      const { data, error } = await supabase.from('proprietarios').insert({ ...p, criado_por: profile?.id }).select().single()
      setSaving(false)
      if (error) { toast.error('Erro: ' + error.message); return }
      toast.success('Proprietário criado')
      navigate(`/painel/proprietarios/${data.id}`, { replace: true })
    } else {
      const { error } = await supabase.from('proprietarios').update(p).eq('id', id)
      setSaving(false)
      if (error) { toast.error('Erro: ' + error.message); return }
      toast.success('Salvo')
    }
  }

  async function criarSubcontaAsaas() {
    if (!id || isNew) { toast.error('Salve o proprietário primeiro'); return }
    if (!p.cpf_cnpj || !p.email) { toast.error('CPF/CNPJ e e-mail obrigatórios pra Asaas'); return }
    setCreatingAccount(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPA_FN}/asaas-create-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ proprietario_id: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      toast.success('Subconta Asaas criada · walletId salvo')
      const { data: refreshed } = await supabase.from('proprietarios').select('*').eq('id', id).single()
      if (refreshed) setP(refreshed)
    } catch (err: any) { toast.error('Erro: ' + err.message) }
    finally { setCreatingAccount(false) }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>

  const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'
  const labelCls = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'
  const set = (k: keyof Proprietario, v: any) => setP({ ...p, [k]: v })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/painel/proprietarios" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{isNew ? 'Novo Proprietário' : p.nome}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && id && (
            <button
              onClick={async () => {
                const ano = new Date().getFullYear() - 1
                const { data } = await supabase.from('contratos_repasses')
                  .select(`*, contratos_locacao(numero, imoveis(codigo, titulo))`)
                  .eq('proprietario_id', id)
                  .eq('status', 'concluido')
                  .gte('data_referencia', `${ano}-01-01`).lte('data_referencia', `${ano}-12-31`)
                if (!data || data.length === 0) {
                  toast.error(`Sem repasses concluídos em ${ano}`); return
                }
                gerarInformeIR(p as any, ano, data as any)
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
            >
              <FileText size={15} />
              Informe IR
            </button>
          )}
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Salvar
          </button>
        </div>
      </div>

      <Section title="Dados Pessoais">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className={labelCls}>Nome completo</label><input className={inputCls} value={p.nome || ''} onChange={(e) => set('nome', e.target.value)} /></div>
          <div><label className={labelCls}>CPF/CNPJ</label><input className={inputCls} value={p.cpf_cnpj || ''} onChange={(e) => set('cpf_cnpj', e.target.value)} /></div>
          <div><label className={labelCls}>RG</label><input className={inputCls} value={p.rg || ''} onChange={(e) => set('rg', e.target.value)} /></div>
          <div><label className={labelCls}>E-mail</label><input type="email" className={inputCls} value={p.email || ''} onChange={(e) => set('email', e.target.value)} /></div>
          <div><label className={labelCls}>Telefone</label><input className={inputCls} value={p.telefone || ''} onChange={(e) => set('telefone', e.target.value)} /></div>
          <div><label className={labelCls}>Data de nascimento</label><input type="date" className={inputCls} value={p.data_nascimento || ''} onChange={(e) => set('data_nascimento', e.target.value)} /></div>
          <div><label className={labelCls}>Estado civil</label><input className={inputCls} value={p.estado_civil || ''} onChange={(e) => set('estado_civil', e.target.value)} /></div>
          <div><label className={labelCls}>Profissão</label><input className={inputCls} value={p.profissao || ''} onChange={(e) => set('profissao', e.target.value)} /></div>
        </div>
      </Section>

      <Section title="Endereço">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2"><label className={labelCls}>Endereço</label><input className={inputCls} value={p.endereco || ''} onChange={(e) => set('endereco', e.target.value)} /></div>
          <div><label className={labelCls}>Número</label><input className={inputCls} value={p.numero || ''} onChange={(e) => set('numero', e.target.value)} /></div>
          <div><label className={labelCls}>Complemento</label><input className={inputCls} value={p.complemento || ''} onChange={(e) => set('complemento', e.target.value)} /></div>
          <div><label className={labelCls}>Bairro</label><input className={inputCls} value={p.bairro || ''} onChange={(e) => set('bairro', e.target.value)} /></div>
          <div><label className={labelCls}>CEP</label><input className={inputCls} value={p.cep || ''} onChange={(e) => set('cep', e.target.value)} /></div>
          <div><label className={labelCls}>Cidade</label><input className={inputCls} value={p.cidade || ''} onChange={(e) => set('cidade', e.target.value)} /></div>
          <div><label className={labelCls}>Estado</label><input maxLength={2} className={inputCls} value={p.estado || ''} onChange={(e) => set('estado', e.target.value.toUpperCase())} /></div>
        </div>
      </Section>

      <Section title="Modo de Repasse">
        <div className="flex flex-col gap-2 sm:flex-row">
          {(['split', 'transfer', 'manual'] as const).map((m) => (
            <button key={m} type="button" onClick={() => set('repasse_modo', m)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition ${
                p.repasse_modo === m
                  ? 'border-moradda-blue-500 bg-moradda-blue-50 text-moradda-blue-700 dark:bg-moradda-blue-900/20 dark:text-moradda-blue-300'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
              {m === 'split' && <Zap size={16} />}
              {m === 'transfer' && <Wallet size={16} />}
              {REPASSE_LABEL[m]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {p.repasse_modo === 'split' && 'Recomendado · Asaas divide automaticamente cada cobrança paga (proprietário precisa ter subconta Asaas).'}
          {p.repasse_modo === 'transfer' && 'Híbrido · dinheiro entra na Moradda, depois é transferido pro proprietário (PIX/TED) — usa dados bancários abaixo.'}
          {p.repasse_modo === 'manual' && 'Sem automação · você gera o repasse manualmente.'}
        </p>
      </Section>

      {p.repasse_modo === 'split' && (
        <Section title="Subconta Asaas (Split)">
          {p.asaas_wallet_id ? (
            <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800/40 dark:bg-green-900/20">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
                  <CheckCircle2 size={15} /> Subconta ativa
                </p>
                <p className="text-xs text-green-700 dark:text-green-400 font-mono mt-1">walletId: {p.asaas_wallet_id}</p>
              </div>
              <a href="https://www.asaas.com" target="_blank" rel="noopener noreferrer"
                className="text-xs text-green-700 hover:underline inline-flex items-center gap-1">
                Ver no Asaas <ExternalLink size={11} />
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
                <p className="flex items-center gap-2 font-medium"><AlertCircle size={14} /> Subconta não criada</p>
                <p className="mt-1">CPF/CNPJ e e-mail obrigatórios. O proprietário receberá e-mail do Asaas pra completar o cadastro KYC (RG + selfie).</p>
              </div>
              <button onClick={criarSubcontaAsaas} disabled={creatingAccount || !p.cpf_cnpj || !p.email}
                className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50">
                {creatingAccount ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                Criar subconta Asaas
              </button>
            </div>
          )}
        </Section>
      )}

      {p.repasse_modo === 'transfer' && (
        <Section title="Dados Bancários (PIX preferencial)">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Tipo de chave PIX</label>
              <select className={inputCls} value={p.pix_tipo || ''} onChange={(e) => set('pix_tipo', e.target.value)}>
                <option value="">—</option>
                <option value="cpf">CPF</option><option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option><option value="telefone">Telefone</option>
                <option value="aleatoria">Aleatória</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Chave PIX</label>
              <input className={inputCls} value={p.pix_chave || ''} onChange={(e) => set('pix_chave', e.target.value)} />
            </div>
            <div className="sm:col-span-2 mt-2 text-xs text-gray-500">Ou conta bancária:</div>
            <div><label className={labelCls}>Banco</label><input className={inputCls} value={p.banco || ''} onChange={(e) => set('banco', e.target.value)} /></div>
            <div><label className={labelCls}>Agência</label><input className={inputCls} value={p.agencia || ''} onChange={(e) => set('agencia', e.target.value)} /></div>
            <div><label className={labelCls}>Conta</label><input className={inputCls} value={p.conta || ''} onChange={(e) => set('conta', e.target.value)} /></div>
            <div><label className={labelCls}>Tipo</label>
              <select className={inputCls} value={p.conta_tipo || ''} onChange={(e) => set('conta_tipo', e.target.value)}>
                <option value="">—</option><option value="corrente">Corrente</option><option value="poupanca">Poupança</option>
              </select>
            </div>
          </div>
        </Section>
      )}

      <Section title="Observações">
        <textarea rows={3} className={inputCls} value={p.observacoes || ''} onChange={(e) => set('observacoes', e.target.value)} />
      </Section>
    </div>
  )
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-moradda-blue-700 dark:text-moradda-blue-300">{title}</h2>
    {children}
  </div>
)
