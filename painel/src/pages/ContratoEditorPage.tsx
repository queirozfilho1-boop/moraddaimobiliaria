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
  papeisPorTipo, MORADDA_DADOS, PAPEIS_COM_CRECI,
  fmtMoeda, calcularPrazoMeses, calcularRepasse,
  isLocacao, isLocacaoMensal, isCompraVenda, isCaptacao, isAdministracao,
  isAssociacao, isTemporada, usaGarantia, usaReajuste, usaVigencia, usaCobrancaMensal,
} from '@/lib/contratos'
import { Home, Briefcase, FileCheck, Percent } from 'lucide-react'
import { gerarPdfContrato, gerarPdfContratoBase64 } from '@/lib/contratoPdf'
import { printContratoFromMd, gerarPdfBase64FromMd } from '@/lib/contratoPrint'
import { mergeTemplate } from '@/lib/contratoMerge'
import CobrancasSection from '@/components/CobrancasSection'
import RepassesSection from '@/components/RepassesSection'
import DespesasSection from '@/components/DespesasSection'
import BuscarCliente, { type Cliente } from '@/components/BuscarCliente'

const SUPA_FN = `${import.meta.env.VITE_SUPABASE_URL || 'https://mvzjqktgnwjwuinnxxcc.supabase.co'}/functions/v1`

interface ImovelLite {
  id: string
  codigo?: string | null
  titulo?: string | null
  tipo?: string | null
  preco?: number | null
  preco_condominio?: number | null
  preco_iptu?: number | null
  endereco?: string | null
  numero?: string | null
  complemento?: string | null
  bairro_nome?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
  area_total?: number | null
  area_construida?: number | null
  quartos?: number | null
  suites?: number | null
  banheiros?: number | null
  vagas_garagem?: number | null
  matricula?: string | null
  cartorio?: string | null
  inscricao_iptu?: string | null
}

const partePadrao = (papel: PartePapel): Omit<ContratoParte, 'id' | 'contrato_id'> => ({
  papel,
  nome: '',
  cpf_cnpj: '',
  rg: '',
  creci: '',
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
    cobranca_modo: 'desativada',
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
  const [corretores, setCorretores] = useState<{ id: string; nome: string; creci?: string | null }[]>([])

  // Carregar imóveis
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('imoveis')
        .select('id, codigo, titulo, tipo, preco, preco_condominio, preco_iptu, endereco, numero, complemento, cidade, estado, cep, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, matricula, cartorio, inscricao_iptu, bairros(nome)')
        .order('codigo')
      // Achata bairros(nome) → bairro_nome em cada item
      const flatten = (data || []).map((i: any) => {
        const { bairros: br, ...rest } = i
        return { ...rest, bairro_nome: br?.nome || null }
      })
      setImoveis(flatten as ImovelLite[])
    })()
  }, [])

  // Carregar corretores (pra dropdowns de captador/parceiro/etc)
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('users_profiles')
        .select('id, nome, creci')
        .eq('is_corretor', true)
        .eq('ativo', true)
        .order('nome')
      setCorretores((data || []) as any)
    })()
  }, [])

  // Carregar contrato existente
  useEffect(() => {
    if (isNew) return
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('contratos_locacao')
        .select('*, imoveis(id, codigo, titulo, tipo, preco, preco_condominio, preco_iptu, endereco, numero, complemento, cidade, estado, cep, area_total, area_construida, quartos, suites, banheiros, vagas_garagem, matricula, cartorio, inscricao_iptu, bairros(nome))')
        .eq('id', id)
        .single()
      if (error || !data) {
        toast.error('Contrato não encontrado')
        navigate('/painel/contratos')
        return
      }
      const { imoveis: im, ...resto } = data as any
      setContrato(resto)
      // Achata bairros(nome) → bairro_nome
      if (im) {
        const { bairros: br, ...imRest } = im as any
        setImovelSelecionado({ ...(imRest as any), bairro_nome: br?.nome || null })
      } else {
        setImovelSelecionado(null)
      }

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

  // Quando o tipo muda, ajustar papéis de partes que ficaram inválidos pro novo tipo
  useEffect(() => {
    if (!contrato.tipo) return
    const validos = papeisPorTipo(contrato.tipo)
    setPartes((prev) => {
      let mudou = false
      const next = prev.map((p) => {
        if (validos.includes(p.papel)) return p
        mudou = true
        return { ...p, papel: validos[0] }
      })
      return mudou ? next : prev
    })
  }, [contrato.tipo])

  // Auto-importar proprietários do imóvel quando o imóvel muda (apenas em contratos novos)
  useEffect(() => {
    if (!contrato.imovel_id || !contrato.tipo || !isNew) return
    ;(async () => {
      const { data: vincs } = await supabase
        .from('imoveis_clientes')
        .select('papel, percentual, clientes(*)')
        .eq('imovel_id', contrato.imovel_id)
      if (!vincs || vincs.length === 0) return

      // Determinar papel de proprietário pelo tipo de contrato
      const papelProprietario: PartePapel | null =
        contrato.tipo === 'locacao_residencial' || contrato.tipo === 'locacao_comercial' || contrato.tipo === 'temporada' ? 'locador' :
        contrato.tipo === 'compra_venda' ? 'vendedor' :
        contrato.tipo === 'captacao_exclusiva' || contrato.tipo === 'administracao' ? 'proprietario' :
        null
      if (!papelProprietario) return

      setPartes((prev) => {
        // Se já tem alguma parte preenchida com nome no papel de proprietário, não mexe
        const jaTem = prev.some((p) => p.papel === papelProprietario && p.nome.trim() !== '')
        if (jaTem) return prev

        // Cria/preenche partes a partir dos clientes proprietários
        const novasPartes = (vincs as any[]).map((v, idx) => {
          const c = v.clientes
          if (!c) return null
          return {
            papel: papelProprietario,
            cliente_id: c.id,
            nome: c.nome || '',
            cpf_cnpj: c.cpf_cnpj || '',
            rg: c.rg || '',
            creci: '',
            nacionalidade: c.nacionalidade || 'Brasileira',
            estado_civil: c.estado_civil || '',
            profissao: c.profissao || '',
            email: c.email || '',
            telefone: c.telefone || '',
            endereco: c.endereco || '',
            numero: c.numero || '',
            complemento: c.complemento || '',
            bairro: c.bairro || '',
            cidade: c.cidade || '',
            estado: c.estado || '',
            cep: c.cep || '',
            data_nascimento: c.data_nascimento || null,
            conjuge_nome: c.conjuge_nome || '',
            conjuge_cpf: c.conjuge_cpf || '',
            observacoes: '',
            ordem: idx,
          } as any
        }).filter(Boolean)

        // Remove placeholders vazios pro mesmo papel e mantém outras partes
        const outrasPartes = prev.filter((p) => p.papel !== papelProprietario || p.nome.trim() !== '')
        return [...novasPartes, ...outrasPartes].map((p, i) => ({ ...p, ordem: i }))
      })
    })()
  }, [contrato.imovel_id, contrato.tipo, isNew])

  // Aplicar dados de um Cliente em uma Parte
  function aplicarCliente(idx: number, c: Cliente | null) {
    if (!c) {
      // Desvincula
      setPartes((prev) => prev.map((p, i) => i === idx ? ({ ...p, cliente_id: null } as any) : p))
      return
    }
    setPartes((prev) => prev.map((p, i) => {
      if (i !== idx) return p
      return {
        ...p,
        cliente_id: c.id,
        nome: c.nome || p.nome,
        cpf_cnpj: c.cpf_cnpj || p.cpf_cnpj,
        rg: c.rg || p.rg,
        nacionalidade: c.nacionalidade || p.nacionalidade,
        estado_civil: c.estado_civil || p.estado_civil,
        profissao: c.profissao || p.profissao,
        email: c.email || p.email,
        telefone: c.telefone || p.telefone,
        endereco: c.endereco || p.endereco,
        numero: c.numero || p.numero,
        complemento: c.complemento || p.complemento,
        bairro: c.bairro || p.bairro,
        cidade: c.cidade || p.cidade,
        estado: c.estado || p.estado,
        cep: c.cep || p.cep,
        data_nascimento: c.data_nascimento || p.data_nascimento,
        conjuge_nome: (c as any).conjuge_nome || (p as any).conjuge_nome,
        conjuge_cpf: (c as any).conjuge_cpf || (p as any).conjuge_cpf,
      } as any
    }))
  }

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
    setPartes((p) => p.map((x, idx) => {
      if (idx !== i) return x
      const next = { ...x, ...patch }
      // Auto-preenchimento: ao escolher Imobiliária e o nome estiver vazio,
      // copia os dados fixos da Moradda
      if (patch.papel === 'imobiliaria' && !next.nome) {
        return { ...next, ...MORADDA_DADOS }
      }
      return next
    }))
  }
  function addParte(papel: PartePapel) {
    const base = partePadrao(papel)
    const dados = papel === 'imobiliaria' ? { ...base, ...MORADDA_DADOS } : base
    setPartes((p) => [...p, { ...dados, papel, ordem: p.length }])
  }
  function removeParte(i: number) {
    setPartes((p) => p.filter((_, idx) => idx !== i))
  }

  async function handleSave(novoStatus?: ContratoStatus) {
    const tipo = contrato.tipo
    if (!tipo) { toast.error('Selecione o tipo de contrato'); return }

    // Validações por tipo
    if (!isAssociacao(tipo) && !contrato.imovel_id) {
      // Associação com Corretor pode não ter imóvel ainda
      toast.error('Selecione o imóvel'); return
    }
    if (usaVigencia(tipo) && (!contrato.data_inicio || !contrato.data_fim)) {
      toast.error('Defina início e fim da vigência'); return
    }
    if (isLocacaoMensal(tipo) && (!contrato.valor_aluguel || contrato.valor_aluguel <= 0)) {
      toast.error('Defina o valor do aluguel'); return
    }
    if (isCompraVenda(tipo) && (!contrato.valor_venda || contrato.valor_venda <= 0)) {
      toast.error('Defina o valor da venda'); return
    }
    if (isTemporada(tipo) && (!contrato.valor_diaria || contrato.valor_diaria <= 0)) {
      toast.error('Defina o valor da diária'); return
    }

    // Partes obrigatórias por tipo
    const partesObrigatorias: Record<string, PartePapel[]> = {
      locacao_residencial: ['locador', 'locatario'],
      locacao_comercial:   ['locador', 'locatario'],
      temporada:           ['locador', 'hospede'],
      compra_venda:        ['vendedor', 'comprador'],
      captacao_exclusiva:  ['proprietario', 'imobiliaria'],
      administracao:       ['proprietario', 'imobiliaria'],
      associacao_corretor: ['imobiliaria', 'corretor_parceiro'],
    }
    for (const papel of partesObrigatorias[tipo] || []) {
      if (partes.filter((p) => p.papel === papel).length === 0) {
        toast.error(`Adicione ao menos um(a) ${PAPEL_LABEL[papel]}`); return
      }
    }
    for (const p of partes) {
      if (!p.nome.trim()) { toast.error(`${PAPEL_LABEL[p.papel]} sem nome`); return }
    }

    setSaving(true)
    try {
      let contratoId = id !== 'novo' ? id : undefined

      // Sanitiza payload — converte strings vazias em null pra colunas com check/uuid
      const sanitize = (obj: any) => {
        const out: any = {}
        for (const [k, v] of Object.entries(obj)) {
          out[k] = v === '' ? null : v
        }
        return out
      }

      if (!contratoId) {
        // Gerar número via RPC
        const { data: numData } = await supabase.rpc('proximo_numero_contrato')
        const numero = (numData as string) || `${new Date().getFullYear()}/000001`

        const { data, error } = await supabase
          .from('contratos_locacao')
          .insert(sanitize({
            ...contrato,
            numero,
            status: novoStatus || contrato.status || 'rascunho',
            criado_por: profile?.id,
            corretor_id: contrato.corretor_id || profile?.id,
          }))
          .select()
          .single()
        if (error) throw error
        contratoId = data.id
      } else {
        const { error } = await supabase
          .from('contratos_locacao')
          .update(sanitize({ ...contrato, status: novoStatus || contrato.status }))
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
    if (!imovelSelecionado && contrato.tipo && !isAssociacao(contrato.tipo)) {
      toast.error('Selecione o imóvel primeiro'); return
    }
    try {
      const md = await buscarModeloMarkdown()
      if (md) {
        const merged = mergeTemplate(md, {
          contrato,
          partes: partes as any,
          imovel: imovelSelecionado as any,
        })
        // Abre janela de impressão (browser gera PDF estilizado)
        printContratoFromMd(merged, contrato.numero)
        toast.success('Janela de impressão aberta. Salve como PDF.')
        return
      } else {
        // Fallback: layout hardcoded antigo
        await gerarPdfContrato({
          contrato: contrato as ContratoLocacao,
          partes: partes as ContratoParte[],
          imovel: imovelSelecionado as any,
        })
      }
      toast.success('PDF gerado')
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''))
    }
  }

  async function handleEnviarAssinatura() {
    if (!id || isNew) { toast.error('Salve o contrato primeiro'); return }
    if (!imovelSelecionado && contrato.tipo && !isAssociacao(contrato.tipo)) {
      toast.error('Selecione o imóvel'); return
    }
    // Signatários por tipo de contrato (testemunhas não assinam pela ZapSign por padrão)
    const papeisSignatarios: string[] = (contrato.tipo ? papeisPorTipo(contrato.tipo).filter((p) => p !== 'testemunha') : [])
    const partesValidas = partes.filter((p) => papeisSignatarios.includes(p.papel))
    if (partesValidas.length === 0) { toast.error('Adicione pelo menos um signatário'); return }
    if (partesValidas.some((p) => !p.email)) { toast.error('Todas as partes signatárias precisam de e-mail'); return }

    setSaving(true)
    try {
      // Gerar PDF base64 (preferir modelo Markdown)
      let pdfBase64: string
      const md = await buscarModeloMarkdown()
      if (md) {
        const merged = mergeTemplate(md, {
          contrato,
          partes: partes as any,
          imovel: imovelSelecionado as any,
        })
        pdfBase64 = await gerarPdfBase64FromMd(merged, contrato.numero)
      } else {
        pdfBase64 = await gerarPdfContratoBase64({
          contrato: contrato as ContratoLocacao,
          partes: partes as ContratoParte[],
          imovel: imovelSelecionado as any,
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
        <div className={`grid grid-cols-1 gap-4 ${contrato.tipo && isAssociacao(contrato.tipo) ? '' : 'sm:grid-cols-2'}`}>
          <div>
            <label className={labelCls}>Tipo de contrato</label>
            <select className={inputCls} value={contrato.tipo} onChange={(e) => setC('tipo', e.target.value as ContratoTipo)}>
              {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {contrato.tipo && !isAssociacao(contrato.tipo) && (
            <div>
              <label className={labelCls}>Imóvel</label>
              <select className={inputCls} value={contrato.imovel_id || ''} onChange={(e) => setC('imovel_id', e.target.value || null)}>
                <option value="">Selecione um imóvel...</option>
                {imoveis.map((i) => (
                  <option key={i.id} value={i.id}>{i.codigo} - {i.titulo}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Section>

      {/* Vigência — não aparece em Compra e Venda */}
      {contrato.tipo && usaVigencia(contrato.tipo) && (
        <Section icon={<Calendar size={16} />} title={
          contrato.tipo === 'temporada' ? 'Período da Estadia' :
          contrato.tipo === 'captacao_exclusiva' ? 'Vigência da Exclusividade' :
          'Vigência'
        }>
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
              <label className={labelCls}>{contrato.tipo === 'temporada' ? 'Diárias' : 'Prazo (meses)'}</label>
              <input type="number" readOnly className={`${inputCls} bg-gray-100 dark:bg-gray-800`} value={contrato.prazo_meses || 0} />
            </div>
            {usaCobrancaMensal(contrato.tipo) && (
              <>
                <div>
                  <label className={labelCls}>Dia do vencimento (cobrança)</label>
                  <input type="number" min={1} max={28} className={inputCls} value={contrato.dia_vencimento || 5} onChange={(e) => setC('dia_vencimento', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelCls}>Dia do repasse ao proprietário</label>
                  <input type="number" min={1} max={28} className={inputCls} value={contrato.repasse_dia || 10} onChange={(e) => setC('repasse_dia', Number(e.target.value))} />
                </div>
              </>
            )}
          </div>
        </Section>
      )}

      {/* Valores — Locação (mensal/temporada) */}
      {contrato.tipo && isLocacao(contrato.tipo) && (
        <Section icon={<DollarSign size={16} />} title={contrato.tipo && isTemporada(contrato.tipo) ? 'Valores · Temporada' : 'Valores · Locação'}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {contrato.tipo && isTemporada(contrato.tipo) ? (
              <>
                <div>
                  <label className={labelCls}>Diária (R$)</label>
                  <input type="number" step="0.01" className={inputCls} value={contrato.valor_diaria || ''} onChange={(e) => setC('valor_diaria', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelCls}>Mínimo de diárias</label>
                  <input type="number" className={inputCls} value={contrato.diaria_minima || ''} onChange={(e) => setC('diaria_minima', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelCls}>Caução (R$)</label>
                  <input type="number" step="0.01" className={inputCls} value={contrato.garantia_valor || ''} onChange={(e) => setC('garantia_valor', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelCls}>Alta temporada — início</label>
                  <input type="date" className={inputCls} value={contrato.alta_temporada_inicio || ''} onChange={(e) => setC('alta_temporada_inicio', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Alta temporada — fim</label>
                  <input type="date" className={inputCls} value={contrato.alta_temporada_fim || ''} onChange={(e) => setC('alta_temporada_fim', e.target.value)} />
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
            <div>
              <label className={labelCls}>Taxa de administração (%)</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.taxa_admin_pct ?? ''} onChange={(e) => setC('taxa_admin_pct', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Taxa adm mínima (R$)</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.taxa_admin_minima ?? ''} onChange={(e) => setC('taxa_admin_minima', Number(e.target.value))} />
            </div>
          </div>

          {!contrato.tipo && isTemporada(contrato.tipo) && (
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
          )}
        </Section>
      )}

      {/* Compra e Venda */}
      {contrato.tipo && isCompraVenda(contrato.tipo) && (
        <Section icon={<Home size={16} />} title="Valores · Compra e Venda">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Valor da venda</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.valor_venda || ''} onChange={(e) => setC('valor_venda', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Sinal/entrada</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.valor_sinal || ''} onChange={(e) => setC('valor_sinal', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Valor financiado</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.valor_financiado || ''} onChange={(e) => setC('valor_financiado', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Banco do financiamento</label>
              <input className={inputCls} value={contrato.banco_financiamento || ''} onChange={(e) => setC('banco_financiamento', e.target.value)} placeholder="Caixa, Bradesco, Itaú..." />
            </div>
            <div>
              <label className={labelCls}>Parcelas (qtd)</label>
              <input type="number" className={inputCls} value={contrato.parcelas_qtd || ''} onChange={(e) => setC('parcelas_qtd', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>ITBI (R$)</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.valor_itbi || ''} onChange={(e) => setC('valor_itbi', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Cartório (R$)</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.valor_cartorio || ''} onChange={(e) => setC('valor_cartorio', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Data da escritura</label>
              <input type="date" className={inputCls} value={contrato.data_escritura || ''} onChange={(e) => setC('data_escritura', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Data do registro</label>
              <input type="date" className={inputCls} value={contrato.data_registro || ''} onChange={(e) => setC('data_registro', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Comissão (%)</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.comissao_pct ?? ''} onChange={(e) => setC('comissao_pct', Number(e.target.value))} placeholder="6" />
            </div>
            <div>
              <label className={labelCls}>Comissão paga por</label>
              <select className={inputCls} value={contrato.comissao_pago_por || 'VENDEDOR'} onChange={(e) => setC('comissao_pago_por', e.target.value)}>
                <option value="VENDEDOR">VENDEDOR</option>
                <option value="COMPRADOR">COMPRADOR</option>
                <option value="AMBOS">AMBOS (50/50)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Data da imissão na posse</label>
              <input type="date" className={inputCls} value={contrato.data_imissao || ''} onChange={(e) => setC('data_imissao', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Natureza das arras</label>
              <select className={inputCls} value={contrato.arras_natureza || 'confirmatórias'} onChange={(e) => setC('arras_natureza', e.target.value)}>
                <option value="confirmatórias">Confirmatórias (art. 417 CC)</option>
                <option value="penitenciais">Penitenciais (art. 420 CC)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Forma de pagamento do sinal</label>
              <input className={inputCls} value={contrato.forma_sinal || ''} onChange={(e) => setC('forma_sinal', e.target.value)} placeholder="TED/PIX no ato da assinatura" />
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>Forma de pagamento do saldo</label>
              <input className={inputCls} value={contrato.forma_saldo || ''} onChange={(e) => setC('forma_saldo', e.target.value)} placeholder="Financiamento + recursos próprios em até 60 dias" />
            </div>
            <div className="flex items-center gap-2 sm:col-span-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!contrato.averbacao} onChange={(e) => setC('averbacao', e.target.checked)} />
                Averbar promessa na matrícula (recomendado quando saldo parcelado)
              </label>
            </div>
          </div>
        </Section>
      )}

      {/* Captação Exclusiva */}
      {contrato.tipo && isCaptacao(contrato.tipo) && (
        <Section icon={<FileCheck size={16} />} title="Termos da Captação Exclusiva">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Comissão acordada (%)</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.comissao_pct ?? ''} onChange={(e) => setC('comissao_pct', Number(e.target.value))} placeholder="6" />
            </div>
            <div>
              <label className={labelCls}>Prazo de exclusividade (meses)</label>
              <input type="number" className={inputCls} value={contrato.prazo_exclusividade_meses || ''} onChange={(e) => setC('prazo_exclusividade_meses', Number(e.target.value))} placeholder="6" />
            </div>
            <div>
              <label className={labelCls}>Valor de venda pretendido</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.valor_venda || ''} onChange={(e) => setC('valor_venda', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Margem de negociação (%)</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.margem_negociacao_percentual ?? ''} onChange={(e) => setC('margem_negociacao_percentual', Number(e.target.value))} placeholder="5" />
            </div>
            <div>
              <label className={labelCls}>Multa por quebra (% comissão)</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.multa_quebra_percentual ?? ''} onChange={(e) => setC('multa_quebra_percentual', Number(e.target.value))} placeholder="100" />
            </div>
            <div>
              <label className={labelCls}>Proteção pós-contrato (dias)</label>
              <input type="number" className={inputCls} value={contrato.prazo_protecao_dias ?? ''} onChange={(e) => setC('prazo_protecao_dias', Number(e.target.value))} placeholder="180" />
            </div>
            <div>
              <label className={labelCls}>Mínimo de fotos profissionais</label>
              <input type="number" className={inputCls} value={contrato.numero_minimo_fotos ?? ''} onChange={(e) => setC('numero_minimo_fotos', Number(e.target.value))} placeholder="12" />
            </div>
            <div>
              <label className={labelCls}>Taxa devolução de material (R$)</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.taxa_devolucao_material ?? ''} onChange={(e) => setC('taxa_devolucao_material', Number(e.target.value))} placeholder="500" />
            </div>
            <div>
              <label className={labelCls}>Reembolso de material (R$)</label>
              <input type="number" step="0.01" className={inputCls} value={(contrato as any).reembolso_fotos_valor ?? ''} onChange={(e) => setC('reembolso_fotos_valor' as any, Number(e.target.value))} placeholder="300" />
            </div>
            <div className="flex items-center gap-2 sm:col-span-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!contrato.placa_autorizada} onChange={(e) => setC('placa_autorizada', e.target.checked)} />
                Placa autorizada no imóvel
              </label>
              <label className="inline-flex items-center gap-2 text-sm ml-4">
                <input type="checkbox" checked={contrato.divulgacao_autorizada !== false} onChange={(e) => setC('divulgacao_autorizada', e.target.checked)} />
                Divulgação autorizada (portais e redes)
              </label>
            </div>
          </div>
        </Section>
      )}

      {/* Administração */}
      {contrato.tipo && isAdministracao(contrato.tipo) && (
        <Section icon={<Briefcase size={16} />} title="Termos de Administração">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Taxa de administração (%)</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.taxa_admin_pct ?? ''} onChange={(e) => setC('taxa_admin_pct', Number(e.target.value))} placeholder="10" />
            </div>
            <div>
              <label className={labelCls}>Taxa mínima (R$/mês)</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.taxa_admin_minima ?? ''} onChange={(e) => setC('taxa_admin_minima', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Repasse ao proprietário (dia)</label>
              <input type="number" min={1} max={28} className={inputCls} value={contrato.repasse_dia || 10} onChange={(e) => setC('repasse_dia', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Aluguel mínimo (R$)</label>
              <input type="number" step="0.01" className={inputCls} value={(contrato as any).aluguel_minimo ?? ''} onChange={(e) => setC('aluguel_minimo' as any, Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>Valor por evento extra (R$)</label>
              <input type="number" step="0.01" className={inputCls} value={(contrato as any).valor_evento_extra ?? ''} onChange={(e) => setC('valor_evento_extra' as any, Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>Multa rescisão administração (%)</label>
              <input type="number" step="0.01" className={inputCls} value={(contrato as any).multa_administracao_pct ?? ''} onChange={(e) => setC('multa_administracao_pct' as any, Number(e.target.value))} placeholder="10" />
            </div>
            <div className="flex items-center gap-2 sm:col-span-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={contrato.inclui_cobranca !== false} onChange={(e) => setC('inclui_cobranca', e.target.checked)} />
                Inclui gestão de cobranças
              </label>
              <label className="inline-flex items-center gap-2 text-sm ml-4">
                <input type="checkbox" checked={!!contrato.inclui_vistoria} onChange={(e) => setC('inclui_vistoria', e.target.checked)} />
                Inclui vistoria periódica
              </label>
            </div>
          </div>
        </Section>
      )}

      {/* Associação com Corretor */}
      {contrato.tipo && isAssociacao(contrato.tipo) && (
        <Section icon={<Percent size={16} />} title="Split da Associação">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <label className={labelCls}>Corretor parceiro</label>
              <select
                className={inputCls}
                value={contrato.corretor_parceiro_id || ''}
                onChange={(e) => setC('corretor_parceiro_id', e.target.value || null)}
              >
                <option value="">Selecione...</option>
                {corretores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}{c.creci ? ` · CRECI ${c.creci}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>% sobre imóvel captado</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.comissao_capt_pct ?? ''} onChange={(e) => setC('comissao_capt_pct', Number(e.target.value))} placeholder="20" />
              <p className="mt-1 text-[10px] text-gray-400">Quando o parceiro só captou e a Moradda vendeu</p>
            </div>
            <div>
              <label className={labelCls}>% sobre imóvel vendido</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.comissao_venda_pct ?? ''} onChange={(e) => setC('comissao_venda_pct', Number(e.target.value))} placeholder="30" />
              <p className="mt-1 text-[10px] text-gray-400">Quando o parceiro só vendeu (a Moradda captou)</p>
            </div>
            <div>
              <label className={labelCls}>% captou e vendeu</label>
              <input type="number" step="0.01" className={inputCls} value={contrato.comissao_capt_venda_pct ?? ''} onChange={(e) => setC('comissao_capt_venda_pct', Number(e.target.value))} placeholder="50" />
              <p className="mt-1 text-[10px] text-gray-400">Quando o parceiro fez tudo</p>
            </div>
          </div>
        </Section>
      )}

      {/* Garantia — só locação mensal */}
      {contrato.tipo && usaGarantia(contrato.tipo) && (
        <Section icon={<Shield size={16} />} title="Garantia">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Tipo de garantia</label>
              <select className={inputCls} value={contrato.garantia_tipo || 'sem_garantia'} onChange={(e) => setC('garantia_tipo', e.target.value as ContratoGarantia)}>
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
      )}

      {/* Reajuste e penalidades — só locação mensal */}
      {contrato.tipo && usaReajuste(contrato.tipo) && (
        <Section icon={<Calendar size={16} />} title="Reajuste e Penalidades">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Índice de reajuste</label>
              <select className={inputCls} value={contrato.indice_reajuste || 'igpm'} onChange={(e) => setC('indice_reajuste', e.target.value as ContratoIndice)}>
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
      )}

      {/* Cláusulas adicionais — Locação Residencial/Comercial */}
      {contrato.tipo && isLocacaoMensal(contrato.tipo) && (
        <Section icon={<FileCheck size={16} />} title="Cláusulas Adicionais">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>IPTU pago por</label>
              <select className={inputCls} value={contrato.iptu_responsavel || 'LOCATÁRIO'} onChange={(e) => setC('iptu_responsavel', e.target.value)}>
                <option value="LOCATÁRIO">LOCATÁRIO</option>
                <option value="LOCADOR">LOCADOR</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>AVCB</label>
              <select className={inputCls} value={contrato.avcb_status || ''} onChange={(e) => setC('avcb_status', e.target.value || null)}>
                <option value="">Não aplicável</option>
                <option value="COM AVCB">COM (entregue ao locador)</option>
                <option value="SEM AVCB">SEM (locatário providencia)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Seguro RC</label>
              <select className={inputCls} value={contrato.seguro_rc_status || ''} onChange={(e) => setC('seguro_rc_status', e.target.value || null)}>
                <option value="">Não aplicável</option>
                <option value="COM SEGURO RC">COM (locatário contrata)</option>
                <option value="SEM SEGURO RC">SEM</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Câmara arbitral (opcional)</label>
              <input className={inputCls} value={contrato.camara_arbitral || ''} onChange={(e) => setC('camara_arbitral', e.target.value)} placeholder="Ex: CAM-CCBC, FGV-Câmara, ou em branco" />
            </div>
            {isCompraVenda(contrato.tipo) === false && contrato.tipo === 'locacao_comercial' && (
              <div className="sm:col-span-3">
                <label className={labelCls}>Ramo de atividade (locação comercial)</label>
                <input className={inputCls} value={contrato.ramo_atividade || ''} onChange={(e) => setC('ramo_atividade', e.target.value)} placeholder="Ex: Comércio varejista de roupas" />
              </div>
            )}
          </div>
        </Section>
      )}

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
                    {(contrato.tipo ? papeisPorTipo(contrato.tipo) : Object.keys(PAPEL_LABEL) as PartePapel[]).map((k) => (
                      <option key={k} value={k}>{PAPEL_LABEL[k]}</option>
                    ))}
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
              {p.papel !== 'imobiliaria' && (
                <div className="mb-3">
                  <label className={labelCls}>Buscar cliente do banco mestre</label>
                  <BuscarCliente
                    value={(p as any).cliente_id ? { id: (p as any).cliente_id, nome: p.nome, cpf_cnpj: p.cpf_cnpj } : null}
                    onSelect={(c) => aplicarCliente(idx, c)}
                    papel={PAPEL_LABEL[p.papel].toLowerCase()}
                    tipoSugerido="pf"
                  />
                </div>
              )}
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
                {PAPEIS_COM_CRECI.includes(p.papel) && (
                  <div>
                    <label className={labelCls}>CRECI</label>
                    <input className={inputCls} value={p.creci || ''} onChange={(e) => updateParte(idx, { creci: e.target.value })} placeholder="RJ 10404" />
                  </div>
                )}
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
                {p.papel === 'fiador' && (
                  <>
                    <div>
                      <label className={labelCls}>Nome do cônjuge (se casado)</label>
                      <input className={inputCls} value={(p as any).conjuge_nome || ''} onChange={(e) => updateParte(idx, { conjuge_nome: e.target.value } as any)} />
                    </div>
                    <div>
                      <label className={labelCls}>CPF do cônjuge</label>
                      <input className={inputCls} value={(p as any).conjuge_cpf || ''} onChange={(e) => updateParte(idx, { conjuge_cpf: e.target.value } as any)} />
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            {(contrato.tipo ? papeisPorTipo(contrato.tipo) : ['locador','locatario','fiador','testemunha'] as PartePapel[]).map((papel) => (
              <button
                key={papel}
                onClick={() => addParte(papel)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              >
                <Plus size={13}/>{PAPEL_LABEL[papel]}
              </button>
            ))}
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
          numeroContrato={contrato.numero}
          locatarioTelefone={partes.find((p) => p.papel === 'locatario' || p.papel === 'hospede')?.telefone || null}
          onChangeModo={async (m) => {
            setC('cobranca_modo', m)
            await supabase.from('contratos_locacao').update({ cobranca_modo: m }).eq('id', id)
          }}
          onSubscriptionCreated={(sid) => setC('asaas_subscription_id', sid)}
        />
      )}

      {/* Despesas (manutenção/reforma com aprovação do proprietário) — só locação mensal/administração */}
      {!isNew && id && contrato.tipo && (isLocacaoMensal(contrato.tipo) || isAdministracao(contrato.tipo)) && (
        <DespesasSection contratoId={id} />
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
