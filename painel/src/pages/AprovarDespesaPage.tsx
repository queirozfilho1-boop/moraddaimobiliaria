import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, AlertCircle, Home, FileText, ExternalLink } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mvzjqktgnwjwuinnxxcc.supabase.co'

interface DespesaPublica {
  id: string
  tipo: string
  descricao: string
  valor: number
  data_despesa: string | null
  status: string
  quem_paga: string
  abater_em: string
  anexo_url: string | null
  observacoes: string | null
  enviado_aprovacao_em: string | null
  aprovado_em: string | null
  recusado_em: string | null
  motivo_recusa: string | null
  contrato: {
    numero: string | null
    imovel: {
      codigo: string | null
      titulo: string | null
      endereco: string | null
      cidade: string | null
      estado: string | null
    }
  }
}

const TIPO_LABEL: Record<string, string> = {
  manutencao: 'Manutenção',
  reforma: 'Reforma',
  taxa: 'Taxa',
  outro: 'Outro',
}

const fmtMoeda = (v: number) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtData = (iso: string | null) => {
  if (!iso) return '—'
  const [y, m, d] = iso.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

export default function AprovarDespesaPage() {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [despesa, setDespesa] = useState<DespesaPublica | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [acting, setActing] = useState(false)
  const [showRecusarModal, setShowRecusarModal] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [nome, setNome] = useState('')
  const [resultado, setResultado] = useState<'aprovada' | 'recusada' | null>(null)

  useEffect(() => {
    ;(async () => {
      if (!token) {
        setErro('Token inválido')
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/despesa-aprovar-publico?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (!res.ok) {
          setErro(data.error || `HTTP ${res.status}`)
        } else {
          setDespesa(data.despesa)
          // Se já decidida, marca como resultado
          if (data.despesa.status === 'aprovada' || data.despesa.status === 'executada' || data.despesa.status === 'paga') {
            setResultado('aprovada')
          } else if (data.despesa.status === 'recusada') {
            setResultado('recusada')
          }
        }
      } catch (err: any) {
        setErro(err.message || 'erro')
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  async function decidir(acao: 'aprovar' | 'recusar') {
    if (!token) return
    if (acao === 'recusar' && (!motivo || motivo.trim().length < 3)) {
      alert('Informe o motivo da recusa (mínimo 3 caracteres)')
      return
    }
    setActing(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/despesa-aprovar-publico?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, motivo: motivo || undefined, nome: nome || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error || `HTTP ${res.status}`)
      } else {
        setResultado(acao === 'aprovar' ? 'aprovada' : 'recusada')
        setShowRecusarModal(false)
      }
    } catch (err: any) {
      setErro(err.message || 'erro')
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  if (erro || !despesa) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
          <AlertCircle className="mx-auto text-red-500" size={48} />
          <h1 className="mt-4 text-xl font-semibold text-gray-800">Não foi possível carregar</h1>
          <p className="mt-2 text-sm text-gray-600">{erro || 'Despesa não encontrada'}</p>
          <p className="mt-4 text-xs text-gray-500">Se o link está expirado, entre em contato com a Moradda Imobiliária.</p>
        </div>
      </div>
    )
  }

  const jaDecidida = resultado !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Logo / Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-blue-700">
            <Home size={28} />
            Moradda Imobiliária
          </div>
          <p className="mt-1 text-xs text-gray-500">Aprovação de despesa do imóvel</p>
        </div>

        {/* Card principal */}
        <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
          {/* Já decidida */}
          {jaDecidida && (
            <div className={`mb-6 rounded-xl p-4 ${resultado === 'aprovada' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start gap-3">
                {resultado === 'aprovada' ? (
                  <CheckCircle2 className="text-green-600 shrink-0" size={24} />
                ) : (
                  <XCircle className="text-red-600 shrink-0" size={24} />
                )}
                <div>
                  <p className={`font-semibold ${resultado === 'aprovada' ? 'text-green-800' : 'text-red-800'}`}>
                    Despesa {resultado === 'aprovada' ? 'aprovada' : 'recusada'}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {resultado === 'aprovada'
                      ? despesa.aprovado_em
                        ? `Em ${fmtData(despesa.aprovado_em)}.`
                        : 'Sua decisão foi registrada.'
                      : despesa.recusado_em
                        ? `Em ${fmtData(despesa.recusado_em)}.${despesa.motivo_recusa ? ` Motivo: ${despesa.motivo_recusa}` : ''}`
                        : 'Sua decisão foi registrada.'}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">Você pode fechar esta página.</p>
                </div>
              </div>
            </div>
          )}

          {/* Imóvel/Contrato */}
          <div className="mb-5 border-b pb-4">
            <div className="text-xs uppercase tracking-wider text-gray-500">Contrato</div>
            <div className="mt-1 font-semibold text-gray-800">{despesa.contrato.numero || '—'}</div>
            <div className="mt-2 text-xs uppercase tracking-wider text-gray-500">Imóvel</div>
            <div className="mt-1 text-sm text-gray-700">
              <span className="font-medium">{despesa.contrato.imovel.codigo || '—'}</span>
              {despesa.contrato.imovel.titulo && <span> · {despesa.contrato.imovel.titulo}</span>}
            </div>
            {despesa.contrato.imovel.endereco && (
              <div className="text-xs text-gray-500">
                {despesa.contrato.imovel.endereco}
                {despesa.contrato.imovel.cidade && ` · ${despesa.contrato.imovel.cidade}/${despesa.contrato.imovel.estado || ''}`}
              </div>
            )}
          </div>

          {/* Despesa */}
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500">Tipo</div>
              <div className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-800">
                <FileText size={14} />
                {TIPO_LABEL[despesa.tipo] || despesa.tipo}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500">Descrição</div>
              <div className="mt-0.5 text-sm text-gray-800 whitespace-pre-wrap">{despesa.descricao}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-500">Valor</div>
                <div className="mt-0.5 text-2xl font-bold text-gray-800">{fmtMoeda(despesa.valor)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-500">Data</div>
                <div className="mt-0.5 text-sm text-gray-800">{fmtData(despesa.data_despesa)}</div>
              </div>
            </div>

            {despesa.observacoes && (
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-500">Observações</div>
                <div className="mt-0.5 text-sm text-gray-700 whitespace-pre-wrap">{despesa.observacoes}</div>
              </div>
            )}

            {despesa.anexo_url && (
              <div>
                <a
                  href={despesa.anexo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  <ExternalLink size={14} />
                  Ver orçamento/comprovante
                </a>
              </div>
            )}
          </div>

          {/* Botões de decisão (só se ainda não decidida) */}
          {!jaDecidida && (
            <div className="mt-8 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600">
                  Seu nome (opcional)
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Como devemos te identificar"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => decidir('aprovar')}
                  disabled={acting}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {acting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Aprovar despesa
                </button>
                <button
                  onClick={() => setShowRecusarModal(true)}
                  disabled={acting}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-red-600 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Recusar
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Moradda Imobiliária · CRECI RJ 10404
        </p>
      </div>

      {/* Modal recusa */}
      {showRecusarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !acting && setShowRecusarModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-800">Recusar despesa</h2>
            <p className="mt-1 text-sm text-gray-600">Por favor, informe o motivo da recusa:</p>
            <textarea
              rows={4}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Valor acima do esperado, fornecedor não autorizado..."
              className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowRecusarModal(false)}
                disabled={acting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => decidir('recusar')}
                disabled={acting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {acting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Confirmar recusa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
