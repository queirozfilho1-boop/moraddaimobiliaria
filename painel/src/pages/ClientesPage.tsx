import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Save, Loader2, User, Building2, Trash2, Pencil, Search,
  Users, Home, FileSignature, Briefcase, ExternalLink, Check, AtSign,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

const SUPA_FN = `${import.meta.env.VITE_SUPABASE_URL || 'https://mvzjqktgnwjwuinnxxcc.supabase.co'}/functions/v1`

interface Cliente {
  id: string
  tipo: 'pf' | 'pj'
  nome: string
  cpf_cnpj?: string | null
  rg?: string | null
  nacionalidade?: string | null
  estado_civil?: string | null
  profissao?: string | null
  data_nascimento?: string | null
  conjuge_nome?: string | null
  conjuge_cpf?: string | null
  nome_fantasia?: string | null
  ie?: string | null
  im?: string | null
  cnae?: string | null
  representante?: string | null
  representante_cpf?: string | null
  representante_cargo?: string | null
  email?: string | null
  telefone?: string | null
  whatsapp?: string | null
  endereco?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
  observacoes?: string | null
  tags?: string[] | null
  lead_origem_id?: string | null
  created_at?: string
  updated_at?: string
}

// =====================================================================
// Lista
// =====================================================================
export const ClientesListPage = () => {
  const [rows, setRows] = useState<Cliente[]>([])
  const [counts, setCounts] = useState<Record<string, { imoveis: number; contratos: number }>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'pf' | 'pj'>('todos')
  const [del, setDel] = useState<Cliente | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('clientes').select('*').order('nome')
    const list = (data || []) as Cliente[]
    setRows(list)

    if (list.length > 0) {
      const ids = list.map((r) => r.id)
      const [{ data: ic }, { data: cp }] = await Promise.all([
        supabase.from('imoveis_clientes').select('cliente_id').in('cliente_id', ids),
        supabase.from('contratos_partes').select('cliente_id').in('cliente_id', ids),
      ])
      const map: Record<string, { imoveis: number; contratos: number }> = {}
      ;(ic || []).forEach((r: any) => {
        if (!r.cliente_id) return
        map[r.cliente_id] = map[r.cliente_id] || { imoveis: 0, contratos: 0 }
        map[r.cliente_id].imoveis++
      })
      ;(cp || []).forEach((r: any) => {
        if (!r.cliente_id) return
        map[r.cliente_id] = map[r.cliente_id] || { imoveis: 0, contratos: 0 }
        map[r.cliente_id].contratos++
      })
      setCounts(map)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (tipoFiltro !== 'todos' && r.tipo !== tipoFiltro) return false
      if (!search) return true
      const s = search.toLowerCase()
      return `${r.nome} ${r.cpf_cnpj || ''} ${r.email || ''} ${r.telefone || ''}`.toLowerCase().includes(s)
    })
  }, [rows, search, tipoFiltro])

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Clientes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Banco mestre de pessoas (PF e PJ) — proprietários, locatários, compradores, leads.
          </p>
        </div>
        <Link to="/painel/clientes/novo" className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600">
          <Plus size={15} />
          Novo Cliente
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF/CNPJ, e-mail ou telefone..."
            className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          />
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-600 dark:bg-gray-700">
          {(['todos', 'pf', 'pj'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipoFiltro(t)}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
                tipoFiltro === t
                  ? 'bg-white text-moradda-blue-700 shadow-sm dark:bg-gray-800 dark:text-moradda-blue-300'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {t === 'todos' ? 'Todos' : t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <Users size={40} className="mx-auto text-gray-400" />
          <h3 className="mt-4 text-base font-semibold text-gray-700 dark:text-gray-200">
            {rows.length === 0 ? 'Nenhum cliente cadastrado' : 'Nada encontrado'}
          </h3>
          {rows.length === 0 && (
            <Link to="/painel/clientes/novo" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white">
              <Plus size={15} /> Cadastrar primeiro cliente
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-left font-medium">CPF/CNPJ</th>
                <th className="px-4 py-3 text-left font-medium">Contato</th>
                <th className="px-4 py-3 text-left font-medium">Cidade</th>
                <th className="px-4 py-3 text-center font-medium">Imóveis</th>
                <th className="px-4 py-3 text-center font-medium">Contratos</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((r) => {
                const cnt = counts[r.id] || { imoveis: 0, contratos: 0 }
                return (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="px-4 py-3">
                      <Link to={`/painel/clientes/${r.id}`} className="flex items-center gap-2 font-medium text-gray-800 hover:text-moradda-blue-600 dark:text-gray-100">
                        <span className="text-gray-400">
                          {r.tipo === 'pj' ? <Building2 size={14} /> : <User size={14} />}
                        </span>
                        {r.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.cpf_cnpj || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      <div>{r.email || '—'}</div>
                      <div>{r.telefone || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {r.cidade ? `${r.cidade}${r.estado ? '/' + r.estado : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {cnt.imoveis > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                          <Home size={11} /> {cnt.imoveis}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {cnt.contratos > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                          <FileSignature size={11} /> {cnt.contratos}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/painel/clientes/${r.id}`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-moradda-blue-600 dark:hover:bg-gray-700">
                          <Pencil size={15} />
                        </Link>
                        <button onClick={() => setDel(r)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {del && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDel(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Excluir cliente</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Remover <strong>{del.nome}</strong>? Vínculos com imóveis serão removidos. Contratos e leads que referenciam este cliente perderão a referência (mas continuam existindo).
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDel(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">Cancelar</button>
              <button
                onClick={async () => {
                  await supabase.from('clientes').delete().eq('id', del.id)
                  setDel(null)
                  load()
                  toast.success('Cliente removido')
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================================
// Detalhe / Editor
// =====================================================================
export const ClienteDetalhePage = () => {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'novo'
  const navigate = useNavigate()
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [c, setC] = useState<Partial<Cliente>>({
    tipo: 'pf',
    nome: '',
    nacionalidade: 'Brasileira',
  })
  const [aba, setAba] = useState<'dados' | 'imoveis' | 'contratos' | 'lead'>('dados')
  const [imoveis, setImoveis] = useState<any[]>([])
  const [contratos, setContratos] = useState<any[]>([])
  const [leadOrigem, setLeadOrigem] = useState<any | null>(null)
  const [proprietarioVinc, setProprietarioVinc] = useState<any | null>(null)
  const [convidando, setConvidando] = useState(false)

  useEffect(() => {
    if (isNew) return
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single()
      if (error || !data) {
        toast.error('Cliente não encontrado'); navigate('/painel/clientes'); return
      }
      setC(data)

      const [{ data: ic }, { data: cp }, { data: lo }, { data: pr }] = await Promise.all([
        supabase
          .from('imoveis_clientes')
          .select('id, papel, percentual, observacao, imoveis(id, codigo, titulo, cidade, estado, status, finalidade)')
          .eq('cliente_id', id),
        supabase
          .from('contratos_partes')
          .select('id, papel, contrato_id, contratos_locacao(id, numero, tipo, status, data_inicio, data_fim, valor_aluguel, valor_venda)')
          .eq('cliente_id', id),
        data.lead_origem_id
          ? supabase.from('leads').select('*').eq('id', data.lead_origem_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('proprietarios').select('id, nome, email, ativo, repasse_modo').eq('cliente_id', id).maybeSingle(),
      ])
      setImoveis((ic || []) as any[])
      setContratos((cp || []) as any[])
      setLeadOrigem((lo as any)?.data || lo || null)
      setProprietarioVinc(pr || null)
      setLoading(false)
    })()
  }, [id, isNew, navigate])

  function set<K extends keyof Cliente>(k: K, v: any) {
    setC((prev) => ({ ...prev, [k]: v }))
  }

  async function save() {
    if (!c.nome || !c.nome.trim()) { toast.error('Defina o nome'); return }
    setSaving(true)
    const payload: any = {}
    for (const [k, v] of Object.entries(c)) {
      if (k === 'id' || k === 'created_at' || k === 'updated_at') continue
      payload[k] = v === '' ? null : v
    }
    if (!payload.tipo) payload.tipo = 'pf'

    if (isNew) {
      const { data, error } = await supabase.from('clientes').insert(payload).select().single()
      setSaving(false)
      if (error) { toast.error('Erro: ' + error.message); return }
      toast.success('Cliente criado')
      navigate(`/painel/clientes/${data.id}`, { replace: true })
    } else {
      payload.updated_at = new Date().toISOString()
      const { error } = await supabase.from('clientes').update(payload).eq('id', id)
      setSaving(false)
      if (error) { toast.error('Erro: ' + error.message); return }
      toast.success('Salvo')
    }
  }

  async function convidarPortal() {
    if (!id || isNew) { toast.error('Salve o cliente primeiro'); return }
    if (!c.email) { toast.error('Cliente precisa de e-mail pra acessar o Portal'); return }
    if (!c.nome) { toast.error('Cliente sem nome'); return }
    setConvidando(true)
    try {
      let proprietarioId = proprietarioVinc?.id
      if (!proprietarioId) {
        // Cria proprietario vinculado a este cliente
        const { data: novo, error: errIns } = await supabase
          .from('proprietarios')
          .insert({
            cliente_id: id,
            nome: c.nome,
            cpf_cnpj: c.cpf_cnpj || null,
            email: c.email,
            telefone: c.telefone || null,
            rg: c.rg || null,
            data_nascimento: c.data_nascimento || null,
            estado_civil: c.estado_civil || null,
            profissao: c.profissao || null,
            nacionalidade: c.nacionalidade || null,
            endereco: c.endereco || null,
            numero: c.numero || null,
            complemento: c.complemento || null,
            bairro: c.bairro || null,
            cidade: c.cidade || null,
            estado: c.estado || null,
            cep: c.cep || null,
            repasse_modo: 'transfer',
            ativo: true,
          })
          .select()
          .single()
        if (errIns) throw errIns
        proprietarioId = novo!.id
        setProprietarioVinc(novo)
      }
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPA_FN}/convidar-proprietario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ proprietario_id: proprietarioId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'erro')
      toast.success('Convite enviado · cliente receberá magic link no e-mail')
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''))
    } finally {
      setConvidando(false)
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>

  const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-moradda-blue-500 focus:outline-none'
  const labelCls = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/painel/clientes" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {isNew ? 'Novo Cliente' : (c.nome || '—')}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {c.tipo === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física'}
              {c.cpf_cnpj ? ` · ${c.cpf_cnpj}` : ''}
              {proprietarioVinc && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  <Check size={10} /> Acesso ao Portal ativo
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && (
            <button
              onClick={convidarPortal}
              disabled={convidando || !c.email}
              title={!c.email ? 'Cliente precisa de e-mail' : 'Convidar pro Portal do Proprietário'}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
            >
              {convidando ? <Loader2 size={15} className="animate-spin" /> : <AtSign size={15} />}
              {proprietarioVinc ? 'Reenviar acesso' : 'Convidar pro Portal'}
            </button>
          )}
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Salvar
          </button>
        </div>
      </div>

      {!isNew && (
        <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700">
          {([
            ['dados', 'Dados', null],
            ['imoveis', 'Imóveis', imoveis.length],
            ['contratos', 'Contratos', contratos.length],
            ['lead', 'Lead origem', leadOrigem ? 1 : null],
          ] as const).map(([k, label, count]) => (
            <button
              key={k}
              onClick={() => setAba(k as any)}
              className={`relative px-4 py-2 text-sm font-medium transition ${
                aba === k
                  ? 'border-b-2 border-moradda-blue-500 text-moradda-blue-700 dark:text-moradda-blue-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {label}
              {count != null && count > 0 && (
                <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium dark:bg-gray-700">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {(aba === 'dados' || isNew) && (
        <>
          <Section title="Tipo">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-600 dark:bg-gray-700">
              {(['pf', 'pj'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('tipo', t)}
                  className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
                    c.tipo === t
                      ? 'bg-white text-moradda-blue-700 shadow-sm dark:bg-gray-800 dark:text-moradda-blue-300'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {t === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </button>
              ))}
            </div>
          </Section>

          <Section title={c.tipo === 'pj' ? 'Dados da Empresa' : 'Dados Pessoais'}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelCls}>{c.tipo === 'pj' ? 'Razão social' : 'Nome completo'}</label>
                <input className={inputCls} value={c.nome || ''} onChange={(e) => set('nome', e.target.value)} />
              </div>
              {c.tipo === 'pj' && (
                <div className="sm:col-span-2">
                  <label className={labelCls}>Nome fantasia</label>
                  <input className={inputCls} value={c.nome_fantasia || ''} onChange={(e) => set('nome_fantasia', e.target.value)} />
                </div>
              )}
              <div><label className={labelCls}>{c.tipo === 'pj' ? 'CNPJ' : 'CPF'}</label><input className={inputCls} value={c.cpf_cnpj || ''} onChange={(e) => set('cpf_cnpj', e.target.value)} /></div>
              {c.tipo === 'pj' ? (
                <>
                  <div><label className={labelCls}>Inscrição Estadual</label><input className={inputCls} value={c.ie || ''} onChange={(e) => set('ie', e.target.value)} /></div>
                  <div><label className={labelCls}>Inscrição Municipal</label><input className={inputCls} value={c.im || ''} onChange={(e) => set('im', e.target.value)} /></div>
                  <div><label className={labelCls}>CNAE</label><input className={inputCls} value={c.cnae || ''} onChange={(e) => set('cnae', e.target.value)} /></div>
                </>
              ) : (
                <>
                  <div><label className={labelCls}>RG</label><input className={inputCls} value={c.rg || ''} onChange={(e) => set('rg', e.target.value)} /></div>
                  <div><label className={labelCls}>Estado civil</label><input className={inputCls} value={c.estado_civil || ''} onChange={(e) => set('estado_civil', e.target.value)} /></div>
                  <div><label className={labelCls}>Profissão</label><input className={inputCls} value={c.profissao || ''} onChange={(e) => set('profissao', e.target.value)} /></div>
                  <div><label className={labelCls}>Nacionalidade</label><input className={inputCls} value={c.nacionalidade || ''} onChange={(e) => set('nacionalidade', e.target.value)} /></div>
                  <div><label className={labelCls}>Data de nascimento</label><input type="date" className={inputCls} value={c.data_nascimento || ''} onChange={(e) => set('data_nascimento', e.target.value)} /></div>
                  <div><label className={labelCls}>Cônjuge — Nome</label><input className={inputCls} value={c.conjuge_nome || ''} onChange={(e) => set('conjuge_nome', e.target.value)} /></div>
                  <div><label className={labelCls}>Cônjuge — CPF</label><input className={inputCls} value={c.conjuge_cpf || ''} onChange={(e) => set('conjuge_cpf', e.target.value)} /></div>
                </>
              )}
            </div>
          </Section>

          {c.tipo === 'pj' && (
            <Section title="Representante Legal">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div><label className={labelCls}>Nome do representante</label><input className={inputCls} value={c.representante || ''} onChange={(e) => set('representante', e.target.value)} /></div>
                <div><label className={labelCls}>CPF</label><input className={inputCls} value={c.representante_cpf || ''} onChange={(e) => set('representante_cpf', e.target.value)} /></div>
                <div><label className={labelCls}>Cargo</label><input className={inputCls} value={c.representante_cargo || ''} onChange={(e) => set('representante_cargo', e.target.value)} /></div>
              </div>
            </Section>
          )}

          <Section title="Contato">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div><label className={labelCls}>E-mail</label><input type="email" className={inputCls} value={c.email || ''} onChange={(e) => set('email', e.target.value)} /></div>
              <div><label className={labelCls}>Telefone</label><input className={inputCls} value={c.telefone || ''} onChange={(e) => set('telefone', e.target.value)} /></div>
              <div><label className={labelCls}>WhatsApp</label><input className={inputCls} value={c.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)} /></div>
            </div>
          </Section>

          <Section title="Endereço">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2"><label className={labelCls}>Endereço</label><input className={inputCls} value={c.endereco || ''} onChange={(e) => set('endereco', e.target.value)} /></div>
              <div><label className={labelCls}>Número</label><input className={inputCls} value={c.numero || ''} onChange={(e) => set('numero', e.target.value)} /></div>
              <div><label className={labelCls}>Complemento</label><input className={inputCls} value={c.complemento || ''} onChange={(e) => set('complemento', e.target.value)} /></div>
              <div><label className={labelCls}>Bairro</label><input className={inputCls} value={c.bairro || ''} onChange={(e) => set('bairro', e.target.value)} /></div>
              <div><label className={labelCls}>CEP</label><input className={inputCls} value={c.cep || ''} onChange={(e) => set('cep', e.target.value)} /></div>
              <div><label className={labelCls}>Cidade</label><input className={inputCls} value={c.cidade || ''} onChange={(e) => set('cidade', e.target.value)} /></div>
              <div><label className={labelCls}>UF</label><input maxLength={2} className={inputCls} value={c.estado || ''} onChange={(e) => set('estado', e.target.value.toUpperCase())} /></div>
            </div>
          </Section>

          <Section title="Observações">
            <textarea rows={3} className={inputCls} value={c.observacoes || ''} onChange={(e) => set('observacoes', e.target.value)} />
          </Section>
        </>
      )}

      {!isNew && aba === 'imoveis' && (
        <Section title="Imóveis Vinculados">
          {imoveis.length === 0 ? (
            <p className="py-3 text-sm text-gray-500 dark:text-gray-400">Nenhum imóvel vinculado a este cliente.</p>
          ) : (
            <div className="space-y-2">
              {imoveis.map((v) => (
                <div key={v.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
                  <Home size={16} className="text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/painel/imoveis/${v.imoveis?.id}`} className="text-sm font-medium text-gray-800 hover:text-moradda-blue-600 dark:text-gray-100">
                      {v.imoveis?.codigo} · {v.imoveis?.titulo || '—'}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {v.imoveis?.cidade ? `${v.imoveis.cidade}/${v.imoveis.estado}` : ''}
                      {' · '}
                      <span className="capitalize">{v.imoveis?.finalidade}</span>
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                    {v.papel} {v.percentual && Number(v.percentual) !== 100 ? `· ${v.percentual}%` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {!isNew && aba === 'contratos' && (
        <Section title="Contratos">
          {contratos.length === 0 ? (
            <p className="py-3 text-sm text-gray-500 dark:text-gray-400">Nenhum contrato encontrado.</p>
          ) : (
            <div className="space-y-2">
              {contratos.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
                  <FileSignature size={16} className="text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/painel/contratos/${p.contrato_id}`} className="text-sm font-medium text-gray-800 hover:text-moradda-blue-600 dark:text-gray-100">
                      {p.contratos_locacao?.numero || p.contrato_id?.substring(0, 8)}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {p.contratos_locacao?.tipo} · papel: <span className="font-medium">{p.papel}</span>
                      {p.contratos_locacao?.data_inicio && ` · ${p.contratos_locacao.data_inicio}`}
                    </p>
                  </div>
                  <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                    {p.contratos_locacao?.status || '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {!isNew && aba === 'lead' && (
        <Section title="Lead de Origem">
          {leadOrigem ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    <Briefcase size={14} className="mr-1 inline text-gray-400" />
                    {leadOrigem.nome || '—'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {leadOrigem.origem ? `via ${leadOrigem.origem}` : ''}
                    {leadOrigem.created_at ? ` · ${new Date(leadOrigem.created_at).toLocaleDateString('pt-BR')}` : ''}
                  </p>
                  {leadOrigem.mensagem && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{leadOrigem.mensagem}</p>
                  )}
                </div>
                <Link to={`/painel/leads`} className="text-xs text-moradda-blue-600 hover:underline">
                  Ver leads <ExternalLink size={11} className="inline" />
                </Link>
              </div>
            </div>
          ) : (
            <p className="py-3 text-sm text-gray-500 dark:text-gray-400">Este cliente não foi convertido a partir de um lead.</p>
          )}
        </Section>
      )}
    </div>
  )
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-moradda-blue-700 dark:text-moradda-blue-300">{title}</h2>
    {children}
  </div>
)

export default ClientesListPage
