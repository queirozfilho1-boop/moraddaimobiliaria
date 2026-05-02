import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Plus, Search, ArrowLeft, Save, Loader2, Pencil, Trash2,
  Check, X, MessageSquareReply, Trophy,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { fmtMoeda, fmtData } from '@/lib/contratos'
import type { PropostaStatus } from '@/lib/vendas'
import { PROPOSTA_STATUS_LABEL, PROPOSTA_STATUS_COR } from '@/lib/vendas'

interface Proposta {
  id: string
  numero: string
  imovel_id: string
  comprador_nome: string
  comprador_cpf_cnpj?: string | null
  comprador_email?: string | null
  comprador_telefone?: string | null
  valor: number
  forma_pagamento?: string | null
  condicoes?: string | null
  prazo_resposta?: string | null
  status: PropostaStatus
  contraproposta_valor?: number | null
  contraproposta_obs?: string | null
  observacoes?: string | null
  imoveis?: { codigo?: string; titulo?: string } | null
  created_at: string
}

export const PropostasListPage = () => {
  const [rows, setRows] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('propostas').select('*, imoveis(codigo, titulo)').order('created_at', { ascending: false })
    setRows((data || []) as Proposta[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function mudarStatus(p: Proposta, novo: PropostaStatus, contra?: { valor: number; obs: string }) {
    const patch: any = { status: novo }
    if (contra) {
      patch.contraproposta_valor = contra.valor
      patch.contraproposta_obs = contra.obs
    }
    await supabase.from('propostas').update(patch).eq('id', p.id)
    toast.success(`Proposta marcada como ${PROPOSTA_STATUS_LABEL[novo]}`)
    load()
  }

  async function virarVenda(p: Proposta) {
    if (p.status !== 'aceita') { toast.error('Apenas propostas aceitas podem virar venda'); return }
    if (!confirm(`Criar venda a partir desta proposta?`)) return
    const { data: numData } = await supabase.rpc('proximo_numero_venda')
    const numero = (numData as string) || `V-${new Date().getFullYear()}/000001`
    const { data, error } = await supabase.from('vendas').insert({
      numero,
      proposta_id: p.id,
      imovel_id: p.imovel_id,
      comprador_nome: p.comprador_nome,
      comprador_cpf_cnpj: p.comprador_cpf_cnpj,
      comprador_email: p.comprador_email,
      comprador_telefone: p.comprador_telefone,
      valor_venda: p.valor,
      data_proposta: p.created_at?.split('T')[0],
      status: 'em_negociacao',
    }).select().single()
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Venda criada · ' + numero)
    window.location.href = `/painel/vendas/${data.id}`
  }

  const filtered = useMemo(() => rows.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return `${r.numero} ${r.comprador_nome} ${r.imoveis?.codigo || ''}`.toLowerCase().includes(s)
    }
    return true
  }), [rows, search, statusFilter])

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Propostas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ofertas dos compradores · aceite/recusa/contraproposta</p>
        </div>
        <Link to="/painel/propostas/novo" className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600">
          <Plus size={15} /> Nova Proposta
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
          <option value="">Todos status</option>
          {Object.entries(PROPOSTA_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-base font-semibold text-gray-700">Nenhuma proposta</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-moradda-blue-600">{r.numero}</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PROPOSTA_STATUS_COR[r.status]}`}>
                      {PROPOSTA_STATUS_LABEL[r.status]}
                    </span>
                    {r.prazo_resposta && (
                      <span className="text-xs text-gray-500">Resposta até: {fmtData(r.prazo_resposta)}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {r.comprador_nome} · {r.imoveis?.codigo || '—'}
                  </h3>
                  <p className="text-xs text-gray-500">{r.imoveis?.titulo || ''}</p>
                  <p className="mt-1 text-lg font-bold text-green-700 dark:text-green-400">{fmtMoeda(r.valor)}</p>
                  {r.forma_pagamento && <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{r.forma_pagamento}</p>}
                  {r.contraproposta_valor && (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                      Contraproposta: {fmtMoeda(r.contraproposta_valor)} {r.contraproposta_obs ? `· ${r.contraproposta_obs}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {r.status === 'feita' && (
                    <>
                      <button onClick={() => mudarStatus(r, 'aceita')} title="Aceitar" className="rounded-lg bg-green-50 p-2 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">
                        <Check size={15} />
                      </button>
                      <button onClick={() => mudarStatus(r, 'recusada')} title="Recusar" className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">
                        <X size={15} />
                      </button>
                      <button onClick={() => {
                        const valor = Number(prompt('Valor da contraproposta?', String(r.valor)) || 0)
                        if (!valor) return
                        const obs = prompt('Observações?') || ''
                        mudarStatus(r, 'contraproposta', { valor, obs })
                      }} title="Contraproposta" className="rounded-lg bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400">
                        <MessageSquareReply size={15} />
                      </button>
                    </>
                  )}
                  {r.status === 'aceita' && (
                    <button onClick={() => virarVenda(r)} title="Virar venda" className="rounded-lg bg-purple-50 p-2 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400">
                      <Trophy size={15} />
                    </button>
                  )}
                  <Link to={`/painel/propostas/${r.id}`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Pencil size={15} />
                  </Link>
                  <button onClick={async () => {
                    if (!confirm(`Excluir proposta ${r.numero}?`)) return
                    await supabase.from('propostas').delete().eq('id', r.id); load()
                  }} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const PropostaEditorPage = () => {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'novo'
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [p, setP] = useState<Partial<Proposta>>({ status: 'feita' })
  const [imoveis, setImoveis] = useState<{ id: string; codigo?: string; titulo?: string }[]>([])

  useEffect(() => {
    supabase.from('imoveis').select('id, codigo, titulo').order('codigo').then(({ data }) => setImoveis((data || []) as any))
  }, [])

  useEffect(() => {
    if (isNew) return
    supabase.from('propostas').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setP(data as any); setLoading(false)
    })
  }, [id, isNew])

  async function save() {
    if (!p.imovel_id) { toast.error('Imóvel'); return }
    if (!p.comprador_nome) { toast.error('Comprador'); return }
    if (!p.valor || p.valor <= 0) { toast.error('Valor'); return }
    setSaving(true)
    if (isNew) {
      const { data: numData } = await supabase.rpc('proximo_numero_proposta')
      const numero = (numData as string) || `P-${new Date().getFullYear()}/000001`
      const { data, error } = await supabase.from('propostas').insert({
        ...p, numero, criado_por: profile?.id, corretor_id: profile?.id,
      }).select().single()
      setSaving(false)
      if (error) { toast.error('Erro: ' + error.message); return }
      toast.success('Proposta criada')
      navigate(`/painel/propostas/${data.id}`, { replace: true })
    } else {
      const { error } = await supabase.from('propostas').update(p).eq('id', id)
      setSaving(false)
      if (error) { toast.error('Erro: ' + error.message); return }
      toast.success('Salvo')
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>

  const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'
  const labelCls = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'
  const set = (k: keyof Proposta, v: any) => setP({ ...p, [k]: v })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/painel/propostas" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{isNew ? 'Nova Proposta' : `Proposta ${p.numero}`}</h1>
        </div>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Salvar
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Imóvel</label>
            <select className={inputCls} value={p.imovel_id || ''} onChange={(e) => set('imovel_id', e.target.value)}>
              <option value="">Selecione...</option>
              {imoveis.map((i) => <option key={i.id} value={i.id}>{i.codigo} - {i.titulo}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><label className={labelCls}>Comprador (nome)</label><input className={inputCls} value={p.comprador_nome || ''} onChange={(e) => set('comprador_nome', e.target.value)} /></div>
          <div><label className={labelCls}>CPF/CNPJ</label><input className={inputCls} value={p.comprador_cpf_cnpj || ''} onChange={(e) => set('comprador_cpf_cnpj', e.target.value)} /></div>
          <div><label className={labelCls}>E-mail</label><input className={inputCls} value={p.comprador_email || ''} onChange={(e) => set('comprador_email', e.target.value)} /></div>
          <div><label className={labelCls}>Telefone</label><input className={inputCls} value={p.comprador_telefone || ''} onChange={(e) => set('comprador_telefone', e.target.value)} /></div>
          <div><label className={labelCls}>Valor proposto</label><input type="number" step="0.01" className={inputCls} value={p.valor || ''} onChange={(e) => set('valor', Number(e.target.value))} /></div>
          <div className="sm:col-span-2"><label className={labelCls}>Forma de pagamento</label><input className={inputCls} placeholder="Ex: 30% à vista + financiamento Caixa" value={p.forma_pagamento || ''} onChange={(e) => set('forma_pagamento', e.target.value)} /></div>
          <div><label className={labelCls}>Prazo pra resposta</label><input type="date" className={inputCls} value={p.prazo_resposta || ''} onChange={(e) => set('prazo_resposta', e.target.value)} /></div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={p.status} onChange={(e) => set('status', e.target.value as PropostaStatus)}>
              {Object.entries(PROPOSTA_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><label className={labelCls}>Condições</label><textarea rows={3} className={inputCls} placeholder="Móveis inclusos, prazo entrega, etc." value={p.condicoes || ''} onChange={(e) => set('condicoes', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={labelCls}>Observações</label><textarea rows={2} className={inputCls} value={p.observacoes || ''} onChange={(e) => set('observacoes', e.target.value)} /></div>
        </div>
      </div>
    </div>
  )
}
