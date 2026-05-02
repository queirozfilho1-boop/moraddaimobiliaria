import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Loader2, User, Wallet, Zap, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface PropOpt { id: string; nome: string; cpf_cnpj?: string | null; asaas_wallet_id?: string | null; repasse_modo: 'split' | 'transfer' | 'manual' }
interface Vinculo {
  id: string
  proprietario_id: string
  participacao_pct: number
  principal: boolean
  proprietarios?: PropOpt | null
}

const Section = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">{children}</div>
)

const ImovelProprietariosSection = ({ imovelId }: { imovelId: string }) => {
  const [vinc, setVinc] = useState<Vinculo[]>([])
  const [opts, setOpts] = useState<PropOpt[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [novoPropId, setNovoPropId] = useState<string>('')
  const [novoPct, setNovoPct] = useState<number>(100)

  async function load() {
    setLoading(true)
    const [{ data: vd }, { data: od }] = await Promise.all([
      supabase
        .from('imoveis_proprietarios')
        .select(`id, proprietario_id, participacao_pct, principal,
                 proprietarios(id, nome, cpf_cnpj, asaas_wallet_id, repasse_modo)`)
        .eq('imovel_id', imovelId)
        .not('proprietario_id', 'is', null)
        .order('principal', { ascending: false }),
      supabase.from('proprietarios').select('id, nome, cpf_cnpj, asaas_wallet_id, repasse_modo').eq('ativo', true).order('nome'),
    ])
    setVinc((vd || []) as any)
    setOpts((od || []) as PropOpt[])
    setLoading(false)
  }

  useEffect(() => { if (imovelId) load() }, [imovelId])

  const totalPct = vinc.reduce((acc, v) => acc + Number(v.participacao_pct || 0), 0)
  const restante = Math.max(0, 100 - totalPct)

  async function adicionar() {
    if (!novoPropId) { toast.error('Selecione um proprietário'); return }
    if (novoPct <= 0 || novoPct > 100) { toast.error('Participação inválida'); return }
    if (vinc.find((v) => v.proprietario_id === novoPropId)) { toast.error('Proprietário já vinculado'); return }
    setAdding(true)
    const { error } = await supabase.from('imoveis_proprietarios').insert({
      imovel_id: imovelId,
      proprietario_id: novoPropId,
      participacao_pct: novoPct,
      principal: vinc.length === 0,
    })
    setAdding(false)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Vinculado')
    setNovoPropId('')
    setNovoPct(restante > 0 ? restante : 100)
    load()
  }

  async function remover(v: Vinculo) {
    if (!confirm(`Remover ${v.proprietarios?.nome || 'proprietário'} deste imóvel?`)) return
    await supabase.from('imoveis_proprietarios').delete().eq('id', v.id)
    load()
  }

  async function tornarPrincipal(v: Vinculo) {
    await supabase.from('imoveis_proprietarios').update({ principal: false }).eq('imovel_id', imovelId)
    await supabase.from('imoveis_proprietarios').update({ principal: true }).eq('id', v.id)
    toast.success('Principal definido')
    load()
  }

  async function alterarPct(v: Vinculo, novo: number) {
    await supabase.from('imoveis_proprietarios').update({ participacao_pct: novo }).eq('id', v.id)
    load()
  }

  return (
    <Section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-moradda-blue-700 dark:text-moradda-blue-300">
          Proprietários do Imóvel
        </h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${totalPct === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          Total: {totalPct.toFixed(0)}%
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-moradda-blue-500" /></div>
      ) : (
        <>
          {vinc.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-3">Nenhum proprietário vinculado.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {vinc.map((v) => (
                <div key={v.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
                  <User size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/painel/proprietarios/${v.proprietario_id}`} className="text-sm font-medium text-gray-800 hover:text-moradda-blue-600 dark:text-gray-100">
                        {v.proprietarios?.nome || '—'}
                      </Link>
                      {v.principal && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Principal</span>}
                      {v.proprietarios?.repasse_modo === 'split' && v.proprietarios?.asaas_wallet_id && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          <Zap size={10} /> Split ativo
                        </span>
                      )}
                      {v.proprietarios?.repasse_modo === 'split' && !v.proprietarios?.asaas_wallet_id && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <AlertCircle size={10} /> Split sem subconta
                        </span>
                      )}
                      {v.proprietarios?.repasse_modo === 'transfer' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          <Wallet size={10} /> Transfer
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{v.proprietarios?.cpf_cnpj || ''}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0.01}
                      max={100}
                      step={0.01}
                      value={v.participacao_pct}
                      onChange={(e) => alterarPct(v, Number(e.target.value))}
                      className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1 text-right text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  {!v.principal && (
                    <button onClick={() => tornarPrincipal(v)} title="Tornar principal" className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600">
                      <CheckCircle2 size={15} />
                    </button>
                  )}
                  <button onClick={() => remover(v)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex flex-wrap gap-2">
              <select
                value={novoPropId}
                onChange={(e) => setNovoPropId(e.target.value)}
                className="flex-1 min-w-[200px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="">— Selecione um proprietário —</option>
                {opts.filter((o) => !vinc.find((v) => v.proprietario_id === o.id)).map((o) => (
                  <option key={o.id} value={o.id}>{o.nome} {o.cpf_cnpj ? `(${o.cpf_cnpj})` : ''}</option>
                ))}
              </select>
              <input
                type="number" min={0.01} max={100} step={0.01}
                value={novoPct || ''}
                onChange={(e) => setNovoPct(Number(e.target.value))}
                placeholder="100"
                className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
              <button onClick={adicionar} disabled={adding || !novoPropId}
                className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50">
                {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                Vincular
              </button>
            </div>
            <Link to="/painel/proprietarios/novo" className="mt-2 inline-flex items-center gap-1 text-xs text-moradda-blue-600 hover:underline">
              <Plus size={12} /> Cadastrar novo proprietário
              <ExternalLink size={11} />
            </Link>
          </div>
        </>
      )}
    </Section>
  )
}

export default ImovelProprietariosSection
