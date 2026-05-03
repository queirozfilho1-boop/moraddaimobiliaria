import { useEffect, useRef, useState } from 'react'
import { Search, Loader2, Plus, X, User, Building2, Check, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export interface Cliente {
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
  lead_origem_id?: string | null
  tags?: string[] | null
}

interface BuscarClienteProps {
  value?: { id: string; nome: string; cpf_cnpj?: string | null } | null
  onSelect: (cliente: Cliente | null) => void
  tipoSugerido?: 'pf' | 'pj'
  papel?: string
  placeholder?: string
  className?: string
}

export default function BuscarCliente({
  value,
  onSelect,
  tipoSugerido = 'pf',
  papel,
  placeholder,
  className,
}: BuscarClienteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Debounce 300ms na busca
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([])
      return
    }
    const handle = setTimeout(async () => {
      setLoading(true)
      const term = query.trim()
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .or(`nome.ilike.%${term}%,cpf_cnpj.ilike.%${term}%,email.ilike.%${term}%`)
        .order('nome')
        .limit(8)
      setResults((data || []) as Cliente[])
      setLoading(false)
    }, 300)
    return () => clearTimeout(handle)
  }, [query])

  function handleSelect(c: Cliente) {
    onSelect(c)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  function handleClear() {
    onSelect(null)
    setQuery('')
  }

  const labelPapel = papel ? `${papel} ` : ''

  // Quando há value (cliente vinculado), mostra badge
  if (value && value.id) {
    return (
      <div className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800/40 dark:bg-emerald-900/20 ${className || ''}`}>
        <div className="flex min-w-0 items-center gap-2">
          <Check size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-emerald-800 dark:text-emerald-300">
              {labelPapel && <span className="font-normal">{labelPapel}</span>}
              vinculado: {value.nome}
            </p>
            {value.cpf_cnpj && (
              <p className="truncate text-xs text-emerald-700/70 dark:text-emerald-400/70">{value.cpf_cnpj}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link
            to={`/painel/clientes/${value.id}`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
            title="Ver cadastro"
          >
            <ExternalLink size={12} />
          </Link>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
            title="Desvincular"
          >
            <X size={12} /> Desvincular
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div ref={wrapperRef} className={`relative ${className || ''}`}>
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            placeholder={placeholder || `Buscar ${labelPapel}por nome, CPF/CNPJ ou e-mail...`}
            className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-9 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-moradda-blue-500 focus:outline-none"
          />
          {loading && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-moradda-blue-500" />
          )}
        </div>
        {open && (query.trim().length >= 2 || results.length > 0) && (
          <div className="absolute left-0 right-0 z-30 mt-1 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
            {results.length === 0 && !loading && query.trim().length >= 2 && (
              <div className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400">
                Nenhum cliente encontrado pra "{query}"
              </div>
            )}
            {results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c)}
                className="flex w-full items-center gap-2 border-b border-gray-100 px-3 py-2 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40"
              >
                <span className="shrink-0 text-gray-400">
                  {c.tipo === 'pj' ? <Building2 size={14} /> : <User size={14} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{c.nome}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {c.cpf_cnpj || '—'}
                    {c.cidade ? ` · ${c.cidade}${c.estado ? '/' + c.estado : ''}` : ''}
                    {c.email ? ` · ${c.email}` : ''}
                  </p>
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setOpen(false); setShowNewModal(true) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-moradda-blue-600 hover:bg-gray-50 dark:text-moradda-blue-300 dark:hover:bg-gray-700/40"
            >
              <Plus size={14} />
              Novo cliente {query ? `(${query})` : ''}
            </button>
          </div>
        )}
      </div>

      {showNewModal && (
        <NovoClienteModal
          tipoInicial={tipoSugerido}
          nomeInicial={query}
          onClose={() => setShowNewModal(false)}
          onCreated={(c) => { setShowNewModal(false); handleSelect(c) }}
        />
      )}
    </>
  )
}

// ===================================================================
// Modal de criação rápida
// ===================================================================

interface NovoClienteModalProps {
  tipoInicial: 'pf' | 'pj'
  nomeInicial?: string
  dadosIniciais?: Partial<Cliente>
  onClose: () => void
  onCreated: (c: Cliente) => void
}

export function NovoClienteModal({ tipoInicial, nomeInicial, dadosIniciais, onClose, onCreated }: NovoClienteModalProps) {
  const [c, setC] = useState<Partial<Cliente>>({
    tipo: tipoInicial,
    nome: nomeInicial || '',
    nacionalidade: 'Brasileira',
    ...(dadosIniciais || {}),
  })
  const [saving, setSaving] = useState(false)

  function set<K extends keyof Cliente>(k: K, v: any) {
    setC((prev) => ({ ...prev, [k]: v }))
  }

  async function save() {
    if (!c.nome || !c.nome.trim()) { toast.error('Defina o nome'); return }
    setSaving(true)
    const payload: any = {}
    for (const [k, v] of Object.entries(c)) {
      payload[k] = v === '' ? null : v
    }
    if (!payload.tipo) payload.tipo = 'pf'
    const { data, error } = await supabase.from('clientes').insert(payload).select().single()
    setSaving(false)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Cliente cadastrado')
    onCreated(data as Cliente)
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-moradda-blue-500 focus:outline-none'
  const labelCls = 'mb-1 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Novo Cliente</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-600 dark:bg-gray-700">
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <div>
            <label className={labelCls}>{c.tipo === 'pj' ? 'CNPJ' : 'CPF'}</label>
            <input className={inputCls} value={c.cpf_cnpj || ''} onChange={(e) => set('cpf_cnpj', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>{c.tipo === 'pj' ? 'IE' : 'RG'}</label>
            <input className={inputCls} value={c.tipo === 'pj' ? c.ie || '' : c.rg || ''} onChange={(e) => set(c.tipo === 'pj' ? 'ie' : 'rg', e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>E-mail</label>
            <input type="email" className={inputCls} value={c.email || ''} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Telefone</label>
            <input className={inputCls} value={c.telefone || ''} onChange={(e) => set('telefone', e.target.value)} />
          </div>

          {c.tipo === 'pf' && (
            <>
              <div>
                <label className={labelCls}>Estado civil</label>
                <input className={inputCls} value={c.estado_civil || ''} onChange={(e) => set('estado_civil', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Profissão</label>
                <input className={inputCls} value={c.profissao || ''} onChange={(e) => set('profissao', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Nacionalidade</label>
                <input className={inputCls} value={c.nacionalidade || ''} onChange={(e) => set('nacionalidade', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Data de nascimento</label>
                <input type="date" className={inputCls} value={c.data_nascimento || ''} onChange={(e) => set('data_nascimento', e.target.value)} />
              </div>
            </>
          )}

          {c.tipo === 'pj' && (
            <>
              <div>
                <label className={labelCls}>Representante legal</label>
                <input className={inputCls} value={c.representante || ''} onChange={(e) => set('representante', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>CPF do representante</label>
                <input className={inputCls} value={c.representante_cpf || ''} onChange={(e) => set('representante_cpf', e.target.value)} />
              </div>
            </>
          )}

          <div className="sm:col-span-2">
            <label className={labelCls}>Endereço</label>
            <input className={inputCls} value={c.endereco || ''} onChange={(e) => set('endereco', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Número</label>
            <input className={inputCls} value={c.numero || ''} onChange={(e) => set('numero', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Complemento</label>
            <input className={inputCls} value={c.complemento || ''} onChange={(e) => set('complemento', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Bairro</label>
            <input className={inputCls} value={c.bairro || ''} onChange={(e) => set('bairro', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>CEP</label>
            <input className={inputCls} value={c.cep || ''} onChange={(e) => set('cep', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Cidade</label>
            <input className={inputCls} value={c.cidade || ''} onChange={(e) => set('cidade', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>UF</label>
            <input maxLength={2} className={inputCls} value={c.estado || ''} onChange={(e) => set('estado', e.target.value.toUpperCase())} />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">
            Cancelar
          </button>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Cadastrar e selecionar
          </button>
        </div>
      </div>
    </div>
  )
}
