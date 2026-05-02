import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Save, Loader2, Trash2, Plus, FileSignature, Download, Send,
  Building2, User, Calendar, DollarSign, Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type {
  ContratoLocacao, ContratoParte, ContratoStatus, ContratoTipo, ContratoGarantia,
  ContratoIndice, PartePapel,
} from '@/lib/contratos'
import {
  TIPO_LABEL, STATUS_LABEL, STATUS_COR, GARANTIA_LABEL, INDICE_LABEL, PAPEL_LABEL,
  fmtMoeda, calcularPrazoMeses, calcularRepasse,
} from '@/lib/contratos'
import { gerarPdfContrato, gerarPdfContratoBase64 } from '@/lib/contratoPdf'
import { downloadPdfContratoFromMd, gerarPdfContratoBase64FromMd } from '@/lib/contratoPdfRender'
import { mergeTemplate } from '@/lib/contratoMerge'
import CobrancasSection from '@/components/CobrancasSection'
import RepassesSection from '@/components/RepassesSection'

const SUPA_FN = `${import.meta.env.VITE_SUPABASE_URL || 'https://mvzjqktgnwjwuinnxxcc.supabase.co'}/functions/v1`

interface ImovelLite {
  id: string
  codigo?: string | null
  titulo?: string | null
  preco?: number | null
  preco_condominio?: number | null
  preco_iptu?: number | null
}

const partePadrao = (papel: PartePapel): Omit<ContratoParte, 'id' | 'contrato_id'> => ({
  papel,
  nome: '',
  cpf_cnpj: '',
  rg: '',
  nacionalidade: 'Brasileira',
  estado_civil: '',
  profissao: '',
  email: '',
  telefone: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  data_nascimento: null,
  observacoes: '',
  ordem: 0,
})

const contratoPadrao = (): Partial<ContratoLocacao> => {
  const hoje = new Date()
  const fim = new Date(hoje)
  fim.setMonth(fim.getMonth() + 30)
  return {
    tipo: 'locacao_residencial',
    status: 'rascunho',
    data_inicio: hoje.toISOString().split('T')[0],
    data_fim: fim.toISOString().split('T')[0],
    dia_vencimento: 5,
    valor_aluguel: 0,
    valor_condominio: 0,
    valor_iptu: 0,
    valor_outros: 0,
    taxa_admin_pct: 10,
    taxa_admin_minima: 0,
    repasse_dia: 10,
    garantia_tipo: 'sem_garantia',
    garantia_valor: 0,
    indice_reajuste: 'igpm',
    multa_atraso_pct: 2,
    juros_dia_pct: 0.033,
    multa_rescisao_meses: 3,
  }
}

const ContratoEditorPage = () => {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'novo'
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [contrato, setContrato] = useState<Partial<ContratoLocacao>>(contratoPadrao())
  const [partes, setPartes] = useState<Array<Omit<ContratoParte, 'id' | 'contrato_id'> & { id?: string }>>([
    { ...partePadrao('locador'), ordem: 0 },
    { ...partePadrao('locatario'), ordem: 1 },
  ])
  const [imoveis, setImoveis] = useState<ImovelLite[]>([])
  const [imovelSelecionado, setImovelSelecionado] = useState<ImovelLite | null>(null)

  // Carregar imóveis
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('imoveis')
        .select('id, codigo, titulo, preco, preco_condominio, preco_iptu')
        .order('codigo')
      setImoveis((data || []) as ImovelLite[])
    })()
  }, [])

  // Carregar contrato existente
  useEffect(() => {
    if (isNew) return
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('contratos_locacao')
        .select('*, imoveis(id, codigo, titulo, preco, preco_condominio, preco_iptu)')
        .eq('id', id)
        .single()
      if (error || !data) {
        toast.error('Contrato não encontrado')
        navigate('/painel/contratos')
        return
      }
      const { imoveis: im, ...resto } = data as any
      setContrato(resto)
      setImovelSelecionado(im)

      const { data: ptsData } = await supabase
        .from('contratos_partes')
        .select('*')
        .eq('contrato_id', id)
        .order('ordem')
      if (ptsData && ptsData.length > 0) {
        setPartes(ptsData as any)
      }
      setLoading(false)
    })()
  }, [id, isNew, navigate])

  // Atualizar imovel selecionado e auto-preencher valores
  useEffect(() => {
    if (!contrato.imovel_id) { setImovelSelecionado(null); return }
    const found = imoveis.find((i) => i.id === contrato.imovel_id)
    if (found && !isNew) return // não sobrescrever ao carregar
    if (found && isNew) {
      setImovelSelecionado(found)
      setContrato((c) => ({
        ...c,
        valor_aluguel: c.valor_aluguel || found.preco || 0,
        valor_condominio: c.valor_condominio || found.preco_condominio || 0,
        valor_iptu: c.valor_iptu || found.preco_iptu || 0,
      }))
    }
  }, [contrato.imovel_id, imoveis, isNew])

  // Atualizar prazo quando datas mudam
  useEffect(() => {
    if (contrato.data_inicio && contrato.data_fim) {
      const m = calcularPrazoMeses(contrato.data_inicio, contrato.data_fim)
      setContrato((c) => ({ ...c, prazo_meses: m }))
    }
  }, [contrato.data_inicio, contrato.data_fim])

  const repasse = useMemo(() => calcularRepasse({
    valor_aluguel: contrato.valor_aluguel || 0,
    valor_condominio: contrato.valor_condominio || 0,
    valor_iptu: contrato.valor_iptu || 0,
    valor_outros: contrato.valor_outros || 0,
    taxa_admin_pct: contrato.taxa_admin_pct || 0,
    taxa_admin_minima: contrato.taxa_admin_minima || 0,
  }), [contrato])

  function setC<K extends keyof ContratoLocacao>(k: K, v: any) {
    setContrato((c) => ({ ...c, [k]: v }))
  }

  function updateParte(i: number, patch: Partial<ContratoParte>) {
    setPartes((p) => p.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  }
  function addParte(papel: PartePapel) {
    setPartes((p) => [...p, { ...partePadrao(papel), ordem: p.length }])
  }
  function removeParte(i: number) {
    setPartes((p) => p.filter((_, idx) => idx !== i))
  }

  async function handleSave(novoStatus?: ContratoStatus) {
    if (!contrato.imovel_id) { toast.error('Selecione o imóvel'); return }
    if (!contrato.data_inicio || !contrato.data_fim) { toast.error('Defina início e fim'); return }
    if (!contrato.valor_aluguel || contrato.valor_aluguel <= 0) { toast.error('Defina o valor do aluguel'); return }
    if (partes.filter((p) => p.papel === 'locador').length === 0) { toast.error('Adicione ao menos um locador'); return }
    if (partes.filter((p) => p.papel === 'locatario').length === 0) { toast.error('Adicione ao menos um locatário'); return }
    for (const p of partes) {
      if (!p.nome.trim()) { toast.error(`${PAPEL_LABEL[p.papel]} sem nome`); return }
    }

    setSaving(true)
    try {
      let contratoId = id !== 'novo' ? id : undefined

      if (!contratoId) {
        // Gerar número via RPC
        const { data: numData } = await supabase.rpc('proximo_numero_contrato')
        const numero = (numData as string) || `${new Date().getFullYear()}/000001`

        const { data, error } = await supabase
          .from('contratos_locacao')
          .insert({
            ...contrato,
            numero,
            status: novoStatus || contrato.status || 'rascunho',
            criado_por: profile?.id,
            corretor_id: contrato.corretor_id || profile?.id,
          })
          .select()
          .single()
        if (error) throw error
        contratoId = data.id
      } else {
        const { error } = await supabase
          .from('contratos_locacao')
          .update({ ...contrato, status: novoStatus || contrato.status })
          .eq('id', contratoId)
        if (error) throw error
      }

      // Salvar partes (delete + insert simplificado)
      if (contratoId) {
        await supabase.from('contratos_partes').delete().eq('contrato_id', contratoId)
        await supabase.from('contratos_partes').insert(
          partes.map((p, idx) => ({ ...p, contrato_id: contratoId, ordem: idx }))
        )
      }

      // Evento
      await supabase.from('contratos_eventos').insert({
        contrato_id: contratoId,
        tipo: isNew ? 'criado' : 'observacao',
        descricao: isNew ? 'Contrato criado' : 'Contrato atualizado',
        usuario_id: profile?.id,
      })

      toast.success(isNew ? 'Contrato criado' : 'Contrato salvo')
      if (isNew && contratoId) navigate(`/painel/contratos/${contratoId}`, { replace: true })
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err.message || ''))
    } finally {
      setSaving(false)
    }
  }

  async function buscarModeloMarkdown(): Promise<string | null> {
    // Se contrato tem modelo_id, usa esse. Senão tenta o padrão do tipo.
    if (contrato.modelo_id) {
      const { data } = await supabase.from('contratos_modelos').select('conteudo').eq('id', contrato.modelo_id).single()
      if (data?.conteudo) return data.conteudo as string
    }
    if (contrato.tipo) {
      const { data } = await supabase.from('contratos_modelos').select('conteudo').eq('tipo', contrato.tipo).eq('padrao', true).eq('ativo', true).limit(1).maybeSingle()
      if (data?.conteudo) return data.conteudo as string
    }
    return null
  }

  async function handleGerarPdf() {
    if (!imovelSelecionado) { toast.error('Selecione o imóvel primeiro'); return }
    try {
      const md = await buscarModeloMarkdown()
      if (md) {
        const merged = mergeTemplate(md, {
          contrato,
          partes: partes as any,
          imovel: imovelSelecionado as any,
        })
        await downloadPdfContratoFromMd(merged, contrato.numero)
      } else {
        // Fallback: layout hardcoded antigo
        await gerarPdfContrato({
          contrato: contrato as ContratoLocacao,
          partes: partes as ContratoParte[],
          imovel: imovelSelecionado,
        })
      }
      toast.success('PDF gerado')
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''))
    }
  }

  async function handleEnviarAssinatura() {
    if (!id || isNew) { toast.error('Salve o contrato primeiro'); return }
    if (!imovelSelecionado) { toast.error('Selecione o imóvel'); return }
    const partesValidas = partes.filter((p) => ['locador', 'locatario', 'fiador', 'avalista'].includes(p.papel))
    if (partesValidas.length === 0) { toast.error('Adicione pelo menos um signatário'); return }
    if (partesValidas.some((p) => !p.email)) { toast.error('Todas as partes signatárias precisam de e-mail'); return }

    setSaving(true)
    try {
      // Salvar primeiro
      await handleSave()
      // Gerar PDF base64 (preferir modelo Markdown)
      let pdfBase64: string
      const md = await buscarModeloMarkdown()
      if (md) {
        const merged = mergeTemplate(md, {
          contrato,
          partes: partes as any,
          imovel: imovelSelecionado as any,
        })
        pdfBase64 = await gerarPdfContratoBase64FromMd(merged, contrato.numero)
      } else {
        pdfBase64 = await gerarPdfContratoBase64({
          contrato: contrato as ContratoLocacao,
          partes: partes as ContratoParte[],
          imovel: imovelSelecionado,
        })
      }
      // Chamar Edge Function
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPA_FN}/zapsign-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ contrato_id: id, pdf_base64: pdfBase64 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      toast.success(`Contrato enviado pra ${data.signers?.length || 0} signatário(s) via ZapSign`)
      // Recarregar
      const { data: updated } = await supabase.from('contratos_locacao').select('*').eq('id', id).single()
      if (updated) setContrato(updated)
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-moradda-blue-500" /></div>
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-moradda-blue-500 focus:outline-none'
  const labelCls = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/painel/contratos" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {isNew ? 'Novo Contrato' : `Contrato ${contrato.numero || '—'}`}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {contrato.status && (
                <span className={`mr-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COR[contrato.status]}`}>
                  {STATUS_LABEL[contrato.status]}
                </span>
              )}
              {isNew ? 'Preencha os dados pra gerar o contrato' : 'Edite, gere PDF e envie pra assinatura'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && (
            <button onClick={handleGerarPdf} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
              <Download size={15} />
              Gerar PDF
            </button>
          )}
          {!isNew && (contrato.status === 'rascunho' || contrato.status === 'aguardando_assinatura') && (
            <button
              onClick={handleEnviarAssinatura}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Enviar pra assinatura (ZapSign)
            </button>
          )}
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600 disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Identificação */}
      <Section icon={<FileSignature size={16} />} title="Identificação">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Tipo de contrato</label>
            <select className={inputCls} value={contrato.tipo} onChange={(e) => setC('tipo', e.target.value as ContratoTipo)}>
              {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Imóvel</label>
            <select className={inputCls} value={contrato.imovel_id || ''} onChange={(e) => setC('imovel_id', e.target.value || null)}>
              <option value="">Selecione um imóvel...</option>
              {imoveis.map((i) => (
                <option key={i.id} value={i.id}>{i.codigo} - {i.titulo}</option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* Vigência */}
      <Section icon={<Calendar size={16} />} title="Vigência">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Data de início</label>
            <input type="date" className={inputCls} value={contrato.data_inicio || ''} onChange={(e) => setC('data_inicio', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Data de término</label>
            <input type="date" className={inputCls} value={contrato.data_fim || ''} onChange={(e) => setC('data_fim', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Prazo (meses)</label>
            <input type="number" readOnly className={`${inputCls} bg-gray-100 dark:bg-gray-800`} value={contrato.prazo_meses || 0} />
          </div>
          <div>
            <label className={labelCls}>Dia do vencimento (cobrança)</label>
            <input type="number" min={1} max={28} className={inputCls} value={contrato.dia_vencimento || 5} onChange={(e) => setC('dia_vencimento', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Dia do repasse ao proprietário</label>
            <input type="number" min={1} max={28} className={inputCls} value={contrato.repasse_dia || 10} onChange={(e) => setC('repasse_dia', Number(e.target.value))} />
          </div>
        </div>
      </Section>

      {/* Valores */}
      <Section icon={<DollarSign size={16} />} title="Valores">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Aluguel (mensal)</label>
            <input type="number" step="0.01" className={inputCls} value={contrato.valor_aluguel || ''} onChange={(e) => setC('valor_aluguel', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Condomínio</label>
            <input type="number" step="0.01" className={inputCls} value={contrato.valor_condominio || ''} onChange={(e) => setC('valor_condominio', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>IPTU</label>
            <input type="number" step="0.01" className={inputCls} value={contrato.valor_iptu || ''} onChange={(e) => setC('valor_iptu', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Outros (água/gás/etc.)</label>
            <input type="number" step="0.01" className={inputCls} value={contrato.valor_outros || ''} onChange={(e) => setC('valor_outros', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Taxa de administração (%)</label>
            <input type="number" step="0.01" className={inputCls} value={contrato.taxa_admin_pct ?? ''} onChange={(e) => setC('taxa_admin_pct', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Taxa adm mínima (R$)</label>
            <input type="number" step="0.01" className={inputCls} value={contrato.taxa_admin_minima ?? ''} onChange={(e) => setC('taxa_admin_minima', Number(e.target.value))} />
          </div>
        </div>

        {/* Resumo */}
        <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-700/30">
          <div>
            <p className="text-xs text-gray-500">Total recebido/mês</p>
            <p className="font-semibold text-gray-800 dark:text-gray-100">{fmtMoeda(repasse.totalRecebido)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Taxa de adm.</p>
            <p className="font-semibold text-amber-700 dark:text-amber-400">- {fmtMoeda(repasse.taxa)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Repasse ao proprietário</p>
            <p className="font-semibold text-green-700 dark:text-green-400">{fmtMoeda(repasse.repasse)}</p>
          </div>
        </div>
      </Section>

      {/* Garantia */}
      <Section icon={<Shield size={16} />} title="Garantia">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Tipo de garantia</label>
            <select className={inputCls} value={contrato.garantia_tipo} onChange={(e) => setC('garantia_tipo', e.target.value as ContratoGarantia)}>
              {Object.entries(GARANTIA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {contrato.garantia_tipo !== 'sem_garantia' && contrato.garantia_tipo !== 'fiador' && (
            <div>
              <label className={labelCls}>Valor da garantia</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.garantia_valor || ''} onChange={(e) => setC('garantia_valor', Number(e.target.value))} />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className={labelCls}>Observações da garantia</label>
            <textarea rows={2} className={inputCls} value={contrato.garantia_observacoes || ''} onChange={(e) => setC('garantia_observacoes', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* Reajuste e penalidades */}
      <Section icon={<Calendar size={16} />} title="Reajuste e Penalidades">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Índice de reajuste</label>
            <select className={inputCls} value={contrato.indice_reajuste} onChange={(e) => setC('indice_reajuste', e.target.value as ContratoIndice)}>
              {Object.entries(INDICE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Multa por atraso (%)</label>
            <input type="number" step="0.01" className={inputCls} value={contrato.multa_atraso_pct ?? ''} onChange={(e) => setC('multa_atraso_pct', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Juros ao dia (%)</label>
            <input type="number" step="0.001" className={inputCls} value={contrato.juros_dia_pct ?? ''} onChange={(e) => setC('juros_dia_pct', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Multa rescisão (meses)</label>
            <input type="number" step="0.5" className={inputCls} value={contrato.multa_rescisao_meses ?? ''} onChange={(e) => setC('multa_rescisao_meses', Number(e.target.value))} />
          </div>
        </div>
      </Section>

      {/* Partes */}
      <Section icon={<User size={16} />} title="Partes do Contrato">
        <div className="space-y-4">
          {partes.map((p, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <select
                    value={p.papel}
                    onChange={(e) => updateParte(idx, { papel: e.target.value as PartePapel })}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-moradda-blue-700 dark:border-gray-600 dark:bg-gray-700 dark:text-moradda-blue-300"
                  >
                    {Object.entries(PAPEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  {p.papel === 'locatario' && (p as any).id && p.email && (
                    <button onClick={async () => {
                      if (!confirm(`Convidar ${p.nome} (${p.email}) pro Portal do Locatário?`)) return
                      try {
                        const { data: { session } } = await supabase.auth.getSession()
                        const res = await fetch(`${SUPA_FN}/convidar-locatario`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
                          body: JSON.stringify({ parte_id: (p as any).id }),
                        })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.error || 'erro')
                        toast.success('Convite enviado · locatário receberá magic link')
                      } catch (err: any) { toast.error('Erro: ' + err.message) }
                    }} className="text-blue-500 hover:text-blue-700" title="Convidar pro Portal">
                      <Send size={15} />
                    </button>
                  )}
                  <button onClick={() => removeParte(idx)} className="text-gray-400 hover:text-red-500" title="Remover">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Nome completo</label>
                  <input className={inputCls} value={p.nome} onChange={(e) => updateParte(idx, { nome: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>CPF/CNPJ</label>
                  <input className={inputCls} value={p.cpf_cnpj || ''} onChange={(e) => updateParte(idx, { cpf_cnpj: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>RG</label>
                  <input className={inputCls} value={p.rg || ''} onChange={(e) => updateParte(idx, { rg: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Estado civil</label>
                  <input className={inputCls} value={p.estado_civil || ''} onChange={(e) => updateParte(idx, { estado_civil: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Profissão</label>
                  <input className={inputCls} value={p.profissao || ''} onChange={(e) => updateParte(idx, { profissao: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>E-mail</label>
                  <input type="email" className={inputCls} value={p.email || ''} onChange={(e) => updateParte(idx, { email: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Telefone</label>
                  <input className={inputCls} value={p.telefone || ''} onChange={(e) => updateParte(idx, { telefone: e.target.value })} />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className={labelCls}>Endereço</label>
                  <input className={inputCls} value={p.endereco || ''} onChange={(e) => updateParte(idx, { endereco: e.target.value })} />
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <button onClick={() => addParte('locador')}    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"><Plus size={13}/>Locador</button>
            <button onClick={() => addParte('locatario')}  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"><Plus size={13}/>Locatário</button>
            <button onClick={() => addParte('fiador')}     className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"><Plus size={13}/>Fiador</button>
            <button onClick={() => addParte('testemunha')} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"><Plus size={13}/>Testemunha</button>
          </div>
        </div>
      </Section>

      {/* Observações */}
      <Section icon={<Building2 size={16} />} title="Observações">
        <textarea rows={4} className={inputCls} placeholder="Cláusulas adicionais, observações gerais..."
          value={contrato.observacoes || ''} onChange={(e) => setC('observacoes', e.target.value)} />
      </Section>

      {/* Repasses ao proprietário */}
      {!isNew && id && <RepassesSection contratoId={id} />}

      {/* Cobranças (só pra contratos salvos) */}
      {!isNew && id && (
        <CobrancasSection
          contratoId={id}
          cobrancaModo={(contrato.cobranca_modo as any) || 'desativada'}
          asaasSubscriptionId={contrato.asaas_subscription_id}
          valorTotal={(contrato.valor_aluguel || 0) + (contrato.valor_condominio || 0) + (contrato.valor_iptu || 0) + (contrato.valor_outros || 0)}
          diaVencimento={contrato.dia_vencimento || 5}
          onChangeModo={async (m) => {
            setC('cobranca_modo', m)
            await supabase.from('contratos_locacao').update({ cobranca_modo: m }).eq('id', id)
          }}
          onSubscriptionCreated={(sid) => setC('asaas_subscription_id', sid)}
        />
      )}
    </div>
  )
}

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
      <span className="text-moradda-blue-500">{icon}</span>
      {title}
    </h2>
    {children}
  </div>
)

export default ContratoEditorPage
