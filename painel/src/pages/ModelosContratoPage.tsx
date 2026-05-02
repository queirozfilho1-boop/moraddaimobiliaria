import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Save, Loader2, FileText, Trash2, Star, StarOff,
  Eye, EyeOff, Sparkles, Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { ContratoTipo } from '@/lib/contratos'
import { TIPO_LABEL } from '@/lib/contratos'
import { TEMPLATES_PADRAO } from '@/lib/templates'

interface Modelo {
  id: string
  nome: string
  tipo: ContratoTipo
  conteudo: string
  ativo: boolean
  padrao: boolean
  observacoes?: string | null
  created_at: string
  updated_at: string
}

export const ModelosContratoListPage = () => {
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('contratos_modelos')
      .select('id, nome, tipo, conteudo, ativo, padrao, observacoes, created_at, updated_at')
      .order('tipo')
      .order('updated_at', { ascending: false })
    if (error) toast.error('Erro: ' + error.message)
    setModelos((data || []) as Modelo[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function seedTemplates() {
    if (!confirm(`Inserir ${TEMPLATES_PADRAO.length} modelos padrão Moradda? (não duplica os existentes com o mesmo nome)`)) return
    setSeeding(true)
    let ok = 0, skip = 0
    for (const t of TEMPLATES_PADRAO) {
      const exist = modelos.find((m) => m.nome === t.nome)
      if (exist) { skip++; continue }
      const { error } = await supabase.from('contratos_modelos').insert({
        nome: t.nome, tipo: t.tipo, conteudo: t.conteudo, padrao: true, ativo: true,
      })
      if (!error) ok++
    }
    setSeeding(false)
    toast.success(`${ok} modelo(s) inserido(s)${skip ? ` · ${skip} já existente(s)` : ''}`)
    load()
  }

  async function toggleAtivo(m: Modelo) {
    await supabase.from('contratos_modelos').update({ ativo: !m.ativo }).eq('id', m.id)
    load()
  }

  async function setPadrao(m: Modelo) {
    // só 1 padrão por tipo
    await supabase.from('contratos_modelos').update({ padrao: false }).eq('tipo', m.tipo)
    await supabase.from('contratos_modelos').update({ padrao: true }).eq('id', m.id)
    toast.success('Modelo padrão definido')
    load()
  }

  async function remover(m: Modelo) {
    if (!confirm(`Remover "${m.nome}"?`)) return
    await supabase.from('contratos_modelos').delete().eq('id', m.id)
    load()
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Modelos de Contrato</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Templates de contrato com placeholders. Use o "Seed" pra carregar os 5 modelos padrão da Moradda.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={seedTemplates} disabled={seeding} className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            {seeding ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            Carregar modelos padrão
          </button>
          <Link to="/painel/modelos-contrato/novo" className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600">
            <Plus size={15} />
            Novo Modelo
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
      ) : modelos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <FileText size={40} className="mx-auto text-gray-400" />
          <h3 className="mt-4 text-base font-semibold text-gray-700 dark:text-gray-200">Nenhum modelo cadastrado</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Clique em "Carregar modelos padrão" pra começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {modelos.map((m) => (
            <div key={m.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{m.nome}</h3>
                    {m.padrao && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><Star size={11} />Padrão</span>}
                    {!m.ativo && <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">Inativo</span>}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {TIPO_LABEL[m.tipo]} · {(m.conteudo || '').length} caracteres · atualizado em {new Date(m.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <Link to={`/painel/modelos-contrato/${m.id}`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-moradda-blue-600 dark:hover:bg-gray-700" title="Editar">
                    <Pencil size={15} />
                  </Link>
                  {!m.padrao && (
                    <button onClick={() => setPadrao(m)} className="rounded-lg p-2 text-gray-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20" title="Definir como padrão deste tipo">
                      <StarOff size={15} />
                    </button>
                  )}
                  <button onClick={() => toggleAtivo(m)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" title={m.ativo ? 'Desativar' : 'Ativar'}>
                    {m.ativo ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button onClick={() => remover(m)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" title="Remover">
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

export const ModeloContratoEditorPage = () => {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'novo'
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [m, setM] = useState<Partial<Modelo>>({
    nome: '',
    tipo: 'locacao_residencial',
    conteudo: '',
    ativo: true,
    padrao: false,
  })

  useEffect(() => {
    if (isNew) return
    ;(async () => {
      const { data } = await supabase.from('contratos_modelos').select('*').eq('id', id).single()
      if (data) setM(data)
      setLoading(false)
    })()
  }, [id, isNew])

  async function save() {
    if (!m.nome) { toast.error('Defina o nome'); return }
    if (!m.conteudo) { toast.error('Cole o conteúdo do contrato'); return }
    setSaving(true)
    if (isNew) {
      const { data, error } = await supabase.from('contratos_modelos').insert({
        nome: m.nome,
        tipo: m.tipo,
        conteudo: m.conteudo,
        ativo: m.ativo,
        padrao: m.padrao,
        criado_por: profile?.id,
      }).select().single()
      setSaving(false)
      if (error) { toast.error('Erro: ' + error.message); return }
      toast.success('Modelo criado')
      navigate(`/painel/modelos-contrato/${data.id}`, { replace: true })
    } else {
      const { error } = await supabase.from('contratos_modelos').update({
        nome: m.nome, tipo: m.tipo, conteudo: m.conteudo, ativo: m.ativo, padrao: m.padrao,
      }).eq('id', id)
      setSaving(false)
      if (error) { toast.error('Erro: ' + error.message); return }
      toast.success('Modelo salvo')
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>

  const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'
  const labelCls = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/painel/modelos-contrato" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{isNew ? 'Novo Modelo' : 'Editar Modelo'}</h1>
        </div>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Salvar
        </button>
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Nome do modelo</label>
            <input className={inputCls} value={m.nome || ''} onChange={(e) => setM({ ...m, nome: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Tipo</label>
            <select className={inputCls} value={m.tipo} onChange={(e) => setM({ ...m, tipo: e.target.value as ContratoTipo })}>
              {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!m.ativo} onChange={(e) => setM({ ...m, ativo: e.target.checked })} />
            Ativo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!m.padrao} onChange={(e) => setM({ ...m, padrao: e.target.checked })} />
            Padrão deste tipo
          </label>
        </div>
        <div>
          <label className={labelCls}>Conteúdo (Markdown)</label>
          <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
            Use <code>{'{{locador.nome}}'}</code>, <code>{'{{contrato.valor_aluguel}}'}</code>, <code>{'{{imovel.endereco_completo}}'}</code> etc.
            Suporta <code>**negrito**</code>, <code>*itálico*</code>, <code># Título</code>, listas com <code>- </code>, e <code>---</code> pra divisor.
          </p>
          <textarea
            rows={28}
            className={inputCls + ' font-mono text-xs'}
            value={m.conteudo || ''}
            onChange={(e) => setM({ ...m, conteudo: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
