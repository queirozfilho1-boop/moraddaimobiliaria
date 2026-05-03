import { useEffect, useState } from 'react'
import { Wrench, Loader2, Plus, RefreshCw, Send, CheckCircle2, DollarSign, Trash2, ExternalLink, Link as LinkIcon, AlertTriangle, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import {
  fmtMoeda, fmtData,
  type ContratoDespesa, type DespesaTipo, type DespesaQuemPaga, type DespesaAbaterEm,
  DESPESA_TIPO_LABEL, DESPESA_STATUS_LABEL, DESPESA_STATUS_COR,
  DESPESA_QUEM_PAGA_LABEL, DESPESA_ABATER_LABEL,
} from '@/lib/contratos'

const SUPA_FN = `${import.meta.env.VITE_SUPABASE_URL || 'https://mvzjqktgnwjwuinnxxcc.supabase.co'}/functions/v1`

interface Props {
  contratoId: string
}

const DespesasSection = ({ contratoId }: Props) => {
  const [despesas, setDespesas] = useState<ContratoDespesa[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [linkAprovacao, setLinkAprovacao] = useState<string | null>(null)

  const [form, setForm] = useState<{
    tipo: DespesaTipo
    descricao: string
    valor: number
    data_despesa: string
    quem_paga: DespesaQuemPaga
    abater_em: DespesaAbaterEm
    observacoes: string
    anexo_file: File | null
  }>({
    tipo: 'manutencao',
    descricao: '',
    valor: 0,
    data_despesa: new Date().toISOString().split('T')[0],
    quem_paga: 'locador',
    abater_em: 'aluguel',
    observacoes: '',
    anexo_file: null,
  })

  async function load() {
    if (!contratoId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('contratos_despesas')
      .select('*')
      .eq('contrato_id', contratoId)
      .order('created_at', { ascending: false })
    if (error) toast.error('Erro: ' + error.message)
    setDespesas((data || []) as ContratoDespesa[])
    setLoading(false)
  }

  useEffect(() => { load() }, [contratoId])

  async function callFn(slug: string, body: any) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${SUPA_FN}/${slug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
    return json
  }

  function resetForm() {
    setForm({
      tipo: 'manutencao',
      descricao: '',
      valor: 0,
      data_despesa: new Date().toISOString().split('T')[0],
      quem_paga: 'locador',
      abater_em: 'aluguel',
      observacoes: '',
      anexo_file: null,
    })
  }

  async function uploadAnexo(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop() || 'bin'
    const path = `despesas/${contratoId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('imoveis').upload(path, file, { upsert: true })
    if (error) {
      toast.error('Erro upload: ' + error.message)
      return null
    }
    const { data } = supabase.storage.from('imoveis').getPublicUrl(path)
    return data?.publicUrl || null
  }

  async function criarDespesa() {
    if (!form.descricao.trim()) { toast.error('Descrição obrigatória'); return }
    if (!form.valor || form.valor <= 0) { toast.error('Valor obrigatório'); return }
    setActing('new')
    try {
      let anexoUrl: string | null = null
      if (form.anexo_file) {
        anexoUrl = await uploadAnexo(form.anexo_file)
      }
      const { error } = await supabase.from('contratos_despesas').insert({
        contrato_id: contratoId,
        tipo: form.tipo,
        descricao: form.descricao,
        valor: form.valor,
        data_despesa: form.data_despesa || null,
        quem_paga: form.quem_paga,
        abater_em: form.abater_em,
        status: 'orcamento',
        observacoes: form.observacoes || null,
        anexo_url: anexoUrl,
      })
      if (error) throw error
      toast.success('Despesa criada')
      setShowModal(false)
      resetForm()
      load()
    } catch (err: any) {
      toast.error('Erro: ' + err.message)
    } finally {
      setActing(null)
    }
  }

  async function enviarAprovacao(d: ContratoDespesa) {
    setActing(d.id)
    try {
      const r = await callFn('despesa-enviar-aprovacao', { despesa_id: d.id })
      setLinkAprovacao(r.link)
      toast.success(r.canal_enviado ? `Enviado via ${r.canal_enviado}` : 'Link gerado — copie e envie')
      load()
    } catch (err: any) {
      toast.error('Erro: ' + err.message)
    } finally {
      setActing(null)
    }
  }

  async function marcarStatus(d: ContratoDespesa, status: 'executada' | 'paga') {
    setActing(d.id)
    try {
      const { error } = await supabase
        .from('contratos_despesas')
        .update({ status })
        .eq('id', d.id)
      if (error) throw error
      toast.success(`Marcada como ${status}`)
      load()
    } catch (err: any) {
      toast.error('Erro: ' + err.message)
    } finally {
      setActing(null)
    }
  }

  async function excluir(d: ContratoDespesa) {
    if (!confirm(`Excluir despesa "${d.descricao}"?`)) return
    setActing(d.id)
    try {
      const { error } = await supabase.from('contratos_despesas').delete().eq('id', d.id)
      if (error) throw error
      toast.success('Excluída')
      load()
    } catch (err: any) {
      toast.error('Erro: ' + err.message)
    } finally {
      setActing(null)
    }
  }

  function copiarLink(link: string) {
    navigator.clipboard.writeText(link).then(
      () => toast.success('Link copiado'),
      () => toast.error('Não foi possível copiar')
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
          <Wrench size={16} className="text-moradda-blue-500" />
          Despesas (manutenção / reforma)
        </h2>
        <div className="flex gap-2">
          <button onClick={load} className="text-xs text-gray-500 hover:text-moradda-blue-600 inline-flex items-center gap-1">
            <RefreshCw size={12} /> Atualizar
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-moradda-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-moradda-blue-600"
          >
            <Plus size={13} /> Nova despesa
          </button>
        </div>
      </div>

      {/* Link de aprovação ativo */}
      {linkAprovacao && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800/40 dark:bg-blue-900/20">
          <p className="text-xs font-medium text-blue-800 dark:text-blue-300 flex items-center gap-1">
            <LinkIcon size={12} /> Link de aprovação gerado
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={linkAprovacao}
              className="flex-1 rounded border border-blue-300 bg-white px-2 py-1 text-xs font-mono text-gray-700 dark:bg-gray-700 dark:text-gray-200"
            />
            <button
              onClick={() => copiarLink(linkAprovacao)}
              className="inline-flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
            >
              <Copy size={11} /> Copiar
            </button>
            <button
              onClick={() => setLinkAprovacao(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              fechar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-moradda-blue-500" /></div>
      ) : despesas.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Nenhuma despesa cadastrada. Use o botão acima pra criar.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Descrição</th>
                <th className="px-3 py-2 text-left font-medium">Tipo</th>
                <th className="px-3 py-2 text-right font-medium">Valor</th>
                <th className="px-3 py-2 text-left font-medium">Quem paga</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {despesas.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                    <div className="font-medium line-clamp-1">{d.descricao}</div>
                    <div className="text-[10px] text-gray-500">
                      {fmtData(d.data_despesa || null)} · {DESPESA_ABATER_LABEL[d.abater_em]}
                    </div>
                    {d.anexo_url && (
                      <a href={d.anexo_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-moradda-blue-600 hover:underline inline-flex items-center gap-0.5">
                        <ExternalLink size={9} /> anexo
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">{DESPESA_TIPO_LABEL[d.tipo]}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="font-medium text-gray-800 dark:text-gray-100">{fmtMoeda(Number(d.valor))}</div>
                    {Number(d.saldo_pendente || 0) > 0 && (
                      <div title="Saldo a abater nos próximos meses" className="inline-flex items-center gap-0.5 text-[10px] text-red-600 dark:text-red-400">
                        <AlertTriangle size={9} /> saldo {fmtMoeda(Number(d.saldo_pendente))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">{DESPESA_QUEM_PAGA_LABEL[d.quem_paga]}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${DESPESA_STATUS_COR[d.status]}`}>
                      {DESPESA_STATUS_LABEL[d.status]}
                    </span>
                    {d.recusado_em && d.motivo_recusa && (
                      <p className="mt-1 text-[10px] text-red-600 line-clamp-2" title={d.motivo_recusa}>{d.motivo_recusa}</p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {d.status === 'orcamento' && (
                        <button
                          onClick={() => enviarAprovacao(d)}
                          disabled={acting === d.id}
                          className="inline-flex items-center gap-1 rounded bg-amber-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                          title="Enviar pra aprovação do proprietário"
                        >
                          {acting === d.id ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                          Enviar aprovação
                        </button>
                      )}
                      {d.status === 'aguardando_aprovacao' && (
                        <button
                          onClick={() => enviarAprovacao(d)}
                          disabled={acting === d.id}
                          className="inline-flex items-center gap-1 rounded border border-amber-400 bg-white px-2 py-1 text-[10px] font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                          title="Reenviar / copiar link"
                        >
                          <LinkIcon size={10} /> Link
                        </button>
                      )}
                      {d.status === 'aprovada' && (
                        <button
                          onClick={() => marcarStatus(d, 'executada')}
                          disabled={acting === d.id}
                          className="inline-flex items-center gap-1 rounded bg-purple-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-purple-600 disabled:opacity-50"
                        >
                          <CheckCircle2 size={10} /> Executada
                        </button>
                      )}
                      {d.status === 'executada' && (
                        <button
                          onClick={() => marcarStatus(d, 'paga')}
                          disabled={acting === d.id}
                          className="inline-flex items-center gap-1 rounded bg-green-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-green-600 disabled:opacity-50"
                        >
                          <DollarSign size={10} /> Paga
                        </button>
                      )}
                      <button
                        onClick={() => excluir(d)}
                        disabled={acting === d.id}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nova despesa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !acting && setShowModal(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Nova despesa</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value as DespesaTipo })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                >
                  {Object.entries(DESPESA_TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Data</label>
                <input
                  type="date"
                  value={form.data_despesa}
                  onChange={(e) => setForm({ ...form, data_despesa: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Descrição</label>
                <textarea
                  rows={2}
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Ex: Reparo de vazamento na cozinha"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.valor || ''}
                  onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Quem paga</label>
                <select
                  value={form.quem_paga}
                  onChange={(e) => setForm({ ...form, quem_paga: e.target.value as DespesaQuemPaga })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                >
                  {Object.entries(DESPESA_QUEM_PAGA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Abater em</label>
                <select
                  value={form.abater_em}
                  onChange={(e) => setForm({ ...form, abater_em: e.target.value as DespesaAbaterEm })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                >
                  {Object.entries(DESPESA_ABATER_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Anexo (orçamento/foto/PDF)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setForm({ ...form, anexo_file: e.target.files?.[0] || null })}
                  className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-moradda-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-moradda-blue-700 dark:text-gray-300"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Observações (opcional)</label>
                <textarea
                  rows={2}
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                disabled={acting === 'new'}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={criarDespesa}
                disabled={acting === 'new'}
                className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50"
              >
                {acting === 'new' ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                Criar despesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DespesasSection
