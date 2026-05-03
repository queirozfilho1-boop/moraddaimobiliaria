import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Loader2, User, Building2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import BuscarCliente, { type Cliente } from '@/components/BuscarCliente'

interface Vinculo {
  id: string
  cliente_id: string
  papel: 'proprietario' | 'co-proprietario'
  percentual: number
  observacao?: string | null
  clientes?: { id: string; nome: string; cpf_cnpj?: string | null; tipo: 'pf' | 'pj'; email?: string | null } | null
}

const Section = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">{children}</div>
)

export default function ImovelClientesSection({ imovelId }: { imovelId: string }) {
  const [vinc, setVinc] = useState<Vinculo[]>([])
  const [loading, setLoading] = useState(true)
  const [novoCliente, setNovoCliente] = useState<Cliente | null>(null)
  const [novoPapel, setNovoPapel] = useState<'proprietario' | 'co-proprietario'>('proprietario')
  const [novoPct, setNovoPct] = useState<number>(100)
  const [adding, setAdding] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('imoveis_clientes')
      .select('id, cliente_id, papel, percentual, observacao, clientes(id, nome, cpf_cnpj, tipo, email)')
      .eq('imovel_id', imovelId)
      .order('papel')
    setVinc((data || []) as any)
    setLoading(false)
  }

  useEffect(() => { if (imovelId) load() }, [imovelId])

  const totalPct = vinc.reduce((acc, v) => acc + Number(v.percentual || 0), 0)

  async function adicionar() {
    if (!novoCliente) { toast.error('Selecione um cliente'); return }
    if (vinc.find((v) => v.cliente_id === novoCliente.id)) { toast.error('Cliente já vinculado'); return }
    if (novoPct <= 0 || novoPct > 100) { toast.error('Percentual inválido'); return }
    setAdding(true)
    const { error } = await supabase.from('imoveis_clientes').insert({
      imovel_id: imovelId,
      cliente_id: novoCliente.id,
      papel: vinc.length === 0 ? 'proprietario' : novoPapel,
      percentual: novoPct,
    })
    setAdding(false)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Cliente vinculado ao imóvel')
    setNovoCliente(null)
    setNovoPapel('co-proprietario')
    setNovoPct(Math.max(0, 100 - totalPct - novoPct))
    load()
  }

  async function remover(v: Vinculo) {
    if (!confirm(`Remover ${v.clientes?.nome || 'cliente'} deste imóvel?`)) return
    await supabase.from('imoveis_clientes').delete().eq('id', v.id)
    load()
  }

  async function alterarPct(v: Vinculo, novo: number) {
    await supabase.from('imoveis_clientes').update({ percentual: novo }).eq('id', v.id)
    load()
  }

  return (
    <Section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-moradda-blue-700 dark:text-moradda-blue-300">
          Proprietários (Clientes)
        </h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${totalPct === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          Total: {totalPct.toFixed(0)}%
        </span>
      </div>

      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Vincule um ou mais clientes do banco mestre como proprietários do imóvel. Em contratos, esses clientes serão automaticamente importados como locadores/vendedores.
      </p>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-moradda-blue-500" /></div>
      ) : (
        <>
          {vinc.length === 0 ? (
            <p className="py-3 text-sm text-gray-500 dark:text-gray-400">Nenhum proprietário cliente vinculado.</p>
          ) : (
            <div className="mb-4 space-y-2">
              {vinc.map((v) => (
                <div key={v.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
                  {v.clientes?.tipo === 'pj' ? <Building2 size={16} className="shrink-0 text-gray-400" /> : <User size={16} className="shrink-0 text-gray-400" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/painel/clientes/${v.cliente_id}`} className="text-sm font-medium text-gray-800 hover:text-moradda-blue-600 dark:text-gray-100">
                        {v.clientes?.nome || '—'}
                      </Link>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        v.papel === 'proprietario'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      }`}>
                        {v.papel === 'proprietario' ? 'Proprietário' : 'Co-proprietário'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{v.clientes?.cpf_cnpj || ''}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min={0.01} max={100} step={0.01}
                      value={v.percentual}
                      onChange={(e) => alterarPct(v, Number(e.target.value))}
                      className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1 text-right text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <Link to={`/painel/clientes/${v.cliente_id}`} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="Abrir cadastro">
                    <ExternalLink size={15} />
                  </Link>
                  <button onClick={() => remover(v)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Remover">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Cliente</label>
                <BuscarCliente value={novoCliente ? { id: novoCliente.id, nome: novoCliente.nome, cpf_cnpj: novoCliente.cpf_cnpj } : null} onSelect={(c) => setNovoCliente(c)} papel="proprietário" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Papel</label>
                <select
                  value={novoPapel}
                  onChange={(e) => setNovoPapel(e.target.value as any)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="proprietario">Proprietário</option>
                  <option value="co-proprietario">Co-proprietário</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">%</label>
                <input
                  type="number" min={0.01} max={100} step={0.01}
                  value={novoPct || ''}
                  onChange={(e) => setNovoPct(Number(e.target.value))}
                  placeholder="100"
                  className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
              <button onClick={adicionar} disabled={adding || !novoCliente}
                className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50">
                {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                Vincular
              </button>
            </div>
          </div>
        </>
      )}
    </Section>
  )
}
