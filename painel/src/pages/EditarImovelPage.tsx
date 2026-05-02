import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Upload,
  ImageIcon,
  Trash2,
  AlertTriangle,
  Loader2,
  ClipboardCheck,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Eye,
  Pause,
  Play,
  Send,
  Clock,
  FileText,
  UserCircle,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import JSZip from 'jszip'
import { Share2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { uploadFotoComWatermark } from '@/lib/watermark'
import ShareImovelModal from '@/components/ShareImovelModal'

// ── Helpers ───────────────────────────────────────────────────────────────
function generateSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Schema ─────────────────────────────────────────────────────────────────
const imovelSchema = z.object({
  titulo: z.string().min(3, 'Título é obrigatório (mín. 3 caracteres)'),
  descricao: z.string().min(10, 'Descrição é obrigatória (mín. 10 caracteres)'),
  tipo: z.enum([
    'casa',
    'apartamento',
    'terreno',
    'comercial',
    'rural',
    'cobertura',
    'kitnet',
    'sobrado',
  ]),
  finalidade: z.enum(['venda', 'aluguel', 'venda_aluguel']),
  status: z.enum([
    'rascunho',
    'enviado_revisao',
    'em_correcao',
    'aprovado',
    'publicado',
    'pausado',
    'reprovado',
    'vendido',
    'alugado',
    'arquivado',
    'inativo',
  ]),

  cep: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().default('Resende'),
  estado: z.string().default('RJ'),

  preco: z.coerce.number().min(1, 'Preço é obrigatório'),
  condominio: z.coerce.number().optional(),
  iptu_anual: z.coerce.number().optional(),

  quartos: z.coerce.number().min(0).default(0),
  suites: z.coerce.number().min(0).default(0),
  banheiros: z.coerce.number().min(0).default(0),
  vagas: z.coerce.number().min(0).default(0),
  area_total: z.coerce.number().optional(),
  area_construida: z.coerce.number().optional(),
  caracteristicas: z.array(z.string()).default([]),

  tour_virtual_url: z.string().url().optional().or(z.literal('')),
  video_url: z.string().url().optional().or(z.literal('')),
  destaque: z.boolean().default(false),

  corretor_id: z.string().optional(),
})

type ImovelFormData = z.infer<typeof imovelSchema>

type ImovelStatus =
  | 'rascunho'
  | 'enviado_revisao'
  | 'em_correcao'
  | 'aprovado'
  | 'publicado'
  | 'pausado'
  | 'reprovado'
  | 'vendido'
  | 'alugado'
  | 'arquivado'
  | 'inativo'

interface RevisaoRecord {
  id: string
  revisor_id: string
  acao: string
  pendencias: string | null
  observacoes: string | null
  created_at: string
  revisor_nome?: string
}

// ── Constants ──────────────────────────────────────────────────────────────
const TIPOS = [
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'rural', label: 'Rural' },
  { value: 'cobertura', label: 'Cobertura' },
  { value: 'kitnet', label: 'Kitnet' },
  { value: 'sobrado', label: 'Sobrado' },
] as const

const FINALIDADES = [
  { value: 'venda', label: 'Venda' },
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'venda_aluguel', label: 'Venda e Aluguel' },
] as const

const STATUS_OPTIONS: { value: ImovelStatus; label: string }[] = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviado_revisao', label: 'Enviado p/ Revisão' },
  { value: 'em_correcao', label: 'Em Correção' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'publicado', label: 'Publicado' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'reprovado', label: 'Reprovado' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'alugado', label: 'Alugado' },
  { value: 'arquivado', label: 'Arquivado' },
  { value: 'inativo', label: 'Inativo' },
]

const CARACTERISTICAS = [
  'Piscina',
  'Churrasqueira',
  'Academia',
  'Varanda',
  'Elevador',
  'Portaria 24h',
  'Playground',
  'Salão de Festas',
  'Ar Condicionado',
  'Aquecimento',
  'Suíte Master',
  'Closet',
  'Lavabo',
  'Escritório',
  'Jardim',
  'Sauna',
  'Quadra Esportiva',
  'Espaço Gourmet',
  'Brinquedoteca',
  'Pet Place',
] as const

const ACAO_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  enviado: { label: 'Enviado para Revisão', color: 'text-blue-600 dark:text-blue-400', icon: 'send' },
  aprovado: { label: 'Aprovado', color: 'text-teal-600 dark:text-teal-400', icon: 'check' },
  devolvido: { label: 'Devolvido para Correção', color: 'text-orange-600 dark:text-orange-400', icon: 'return' },
  reprovado: { label: 'Reprovado', color: 'text-red-600 dark:text-red-400', icon: 'x' },
  pausado: { label: 'Pausado', color: 'text-yellow-600 dark:text-yellow-400', icon: 'pause' },
  despausado: { label: 'Despausado', color: 'text-green-600 dark:text-green-400', icon: 'play' },
  corrigido: { label: 'Reenviado após Correção', color: 'text-blue-600 dark:text-blue-400', icon: 'send' },
}

// ── Reusable form sub-components ───────────────────────────────────────────
function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">
        {title}
      </h2>
      {children}
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-500">{message}</p>
}

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 transition focus:border-moradda-blue-500 focus:outline-none focus:ring-2 focus:ring-moradda-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500'

const labelClass =
  'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

// ── Page component ─────────────────────────────────────────────────────────
export default function EditarImovelPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const isAdmin = profile?.role === 'superadmin' || profile?.role === 'gestor'
  const isCorretor = profile?.role === 'corretor'

  const [isDragOver, setIsDragOver] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [corretorId, setCorretorId] = useState('')
  const [currentStatus, setCurrentStatus] = useState<ImovelStatus>('rascunho')
  const [bairros, setBairros] = useState<{ id: string; nome: string }[]>([])
  const [corretores, setCorretores] = useState<{ id: string; nome: string }[]>([])
  const [savingDraft, setSavingDraft] = useState(false)
  const [fotosExistentes, setFotosExistentes] = useState<{ id: string; url: string; url_watermark: string; principal: boolean; ordem: number }[]>([])
  const [baixandoZip, setBaixandoZip] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [draggingFotoIdx, setDraggingFotoIdx] = useState<number | null>(null)
  const [novasFotos, setNovasFotos] = useState<{ file: File; preview: string; principal: boolean }[]>([])
  const [uploadingFotos, setUploadingFotos] = useState(false)

  // Proprietário state
  const [proprietario, setProprietario] = useState({
    id: '', nome: '', cpf_cnpj: '', telefone: '', email: '', endereco: '', observacoes: ''
  })
  const [savingProprietario, setSavingProprietario] = useState(false)

  // Documentos state
  const [docsExistentes, setDocsExistentes] = useState<{ id: string; tipo: string; nome_arquivo: string; url: string; created_at: string }[]>([])
  const [novosDocumentos, setNovosDocumentos] = useState<{ file: File; tipo: string; observacoes: string }[]>([])
  const [uploadingDocs, setUploadingDocs] = useState(false)

  const TIPOS_DOCUMENTO = [
    { value: 'escritura', label: 'Escritura' },
    { value: 'matricula', label: 'Matrícula' },
    { value: 'iptu', label: 'IPTU' },
    { value: 'contrato', label: 'Contrato' },
    { value: 'procuracao', label: 'Procuração' },
    { value: 'certidao_negativa', label: 'Certidão Negativa' },
    { value: 'habite_se', label: 'Habite-se' },
    { value: 'planta', label: 'Planta' },
    { value: 'laudo_avaliacao', label: 'Laudo de Avaliação' },
    { value: 'comprovante_propriedade', label: 'Comprovante de Propriedade' },
    { value: 'rgi', label: 'RGI' },
    { value: 'outro', label: 'Outro' },
  ] as const

  // Review workflow state
  const [revisoes, setRevisoes] = useState<RevisaoRecord[]>([])
  const [reviewAction, setReviewAction] = useState<'aprovar' | 'devolver' | 'reprovar' | null>(null)
  const [reviewText, setReviewText] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ImovelFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(imovelSchema) as any,
    defaultValues: {
      tipo: 'casa',
      finalidade: 'venda',
      status: 'rascunho',
      cidade: 'Resende',
      estado: 'RJ',
      quartos: 0,
      suites: 0,
      banheiros: 0,
      vagas: 0,
      caracteristicas: [],
      destaque: false,
    },
  })

  const caracteristicasWatch = watch('caracteristicas')
  const destaqueWatch = watch('destaque')

  // Fetch bairros from Supabase
  useEffect(() => {
    async function fetchBairros() {
      const { data, error } = await supabase
        .from('bairros')
        .select('id, nome')
        .order('nome')
      if (error) {
        toast.error('Erro ao carregar bairros: ' + error.message)
        return
      }
      setBairros(data || [])
    }
    fetchBairros()
  }, [])

  // Fetch corretores for admin
  useEffect(() => {
    if (!isAdmin) return
    async function fetchCorretores() {
      const { data, error } = await supabase
        .from('users_profiles')
        .select('id, nome')
        .eq('ativo', true)
      if (error) {
        toast.error('Erro ao carregar corretores: ' + error.message)
        return
      }
      setCorretores(data || [])
    }
    fetchCorretores()
  }, [isAdmin])

  // Fetch imovel data
  useEffect(() => {
    if (!id) return
    async function fetchImovel() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('imoveis')
          .select('*, bairros(id, nome)')
          .eq('id', id)
          .single()

        if (error) throw error
        if (!data) throw new Error('Imóvel não encontrado')

        setCodigo(data.codigo || '')
        setCorretorId(data.corretor_id || '')
        setCurrentStatus(data.status as ImovelStatus)

        // Buscar fotos existentes
        const { data: fotosData } = await supabase
          .from('imoveis_fotos')
          .select('id, url, url_watermark, principal, ordem')
          .eq('imovel_id', id)
          .order('ordem')
        setFotosExistentes((fotosData || []).map((f: any, i) => ({ id: f.id, url: f.url || '', url_watermark: f.url_watermark || '', principal: f.principal, ordem: f.ordem ?? i })))

        // Buscar histórico de revisões
        const { data: revisoesData } = await supabase
          .from('imoveis_revisoes')
          .select('id, revisor_id, acao, pendencias, observacoes, created_at, users_profiles!revisor_id(nome)')
          .eq('imovel_id', id)
          .order('created_at', { ascending: false })
        setRevisoes((revisoesData || []).map((r: any) => ({
          ...r,
          revisor_nome: r.users_profiles?.nome || 'Sistema',
        })))

        // Buscar proprietário
        const { data: propData } = await supabase
          .from('imoveis_proprietarios')
          .select('*')
          .eq('imovel_id', id)
          .limit(1)
          .maybeSingle()
        if (propData) {
          setProprietario({
            id: propData.id,
            nome: propData.nome || '',
            cpf_cnpj: propData.cpf_cnpj || '',
            telefone: propData.telefone || '',
            email: propData.email || '',
            endereco: propData.endereco || '',
            observacoes: propData.observacoes || '',
          })
        }

        // Buscar documentos
        const { data: docsData } = await supabase
          .from('imoveis_documentos')
          .select('id, tipo, nome_arquivo, url, created_at')
          .eq('imovel_id', id)
          .order('created_at')
        setDocsExistentes(docsData || [])

        reset({
          titulo: data.titulo || '',
          descricao: data.descricao || '',
          tipo: data.tipo || 'casa',
          finalidade: data.finalidade || 'venda',
          status: data.status || 'rascunho',
          cep: data.cep || '',
          endereco: data.endereco || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro_id || '',
          cidade: data.cidade || 'Resende',
          estado: data.estado || 'RJ',
          preco: data.preco || 0,
          condominio: data.preco_condominio || 0,
          iptu_anual: data.preco_iptu || 0,
          quartos: data.quartos || 0,
          suites: data.suites || 0,
          banheiros: data.banheiros || 0,
          vagas: data.vagas_garagem || 0,
          area_total: data.area_total || 0,
          area_construida: data.area_construida || 0,
          caracteristicas: data.caracteristicas || [],
          tour_virtual_url: data.tour_virtual_url || '',
          video_url: data.video_url || '',
          destaque: data.destaque || false,
          corretor_id: data.corretor_id || '',
        })
      } catch (err: any) {
        toast.error('Erro ao carregar imóvel: ' + (err.message || 'Erro desconhecido'))
        navigate('/painel/imoveis')
      } finally {
        setLoading(false)
      }
    }
    fetchImovel()
  }, [id, reset, navigate])

  function toggleCaracteristica(item: string) {
    const current = caracteristicasWatch || []
    if (current.includes(item)) {
      setValue(
        'caracteristicas',
        current.filter((c) => c !== item),
      )
    } else {
      setValue('caracteristicas', [...current, item])
    }
  }

  function handleFiles(files: FileList | File[]) {
    const newFotos = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(file => ({
        file,
        preview: URL.createObjectURL(file),
        principal: fotosExistentes.length === 0 && novasFotos.length === 0,
      }))
    setNovasFotos(prev => [...prev, ...newFotos])
  }

  function removeNovaFoto(index: number) {
    setNovasFotos(prev => prev.filter((_, i) => i !== index))
  }

  async function removeFotoExistente(fotoId: string) {
    await supabase.from('imoveis_fotos').delete().eq('id', fotoId)
    setFotosExistentes(prev => prev.filter(f => f.id !== fotoId))
    toast.success('Foto removida')
  }

  // Reordenar fotos existentes (drag and drop)
  function reorderFotos(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return
    setFotosExistentes(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      // reatribui ordem 0..N-1
      return next.map((f, i) => ({ ...f, ordem: i }))
    })
  }

  async function persistFotoOrder() {
    try {
      // Atualiza ordem de todas as fotos no banco e captura erros individuais
      const results = await Promise.all(
        fotosExistentes.map((f, i) =>
          supabase.from('imoveis_fotos').update({ ordem: i }).eq('id', f.id)
        )
      )
      const failed = results.filter(r => r.error)
      if (failed.length > 0) {
        console.error('Erros ao salvar ordem:', failed.map(r => r.error))
        toast.error(`${failed.length} foto(s) com erro · ${failed[0].error?.message || 'verifique permissões'}`)
        return
      }
      toast.success('Ordem das fotos salva')
    } catch (err: any) {
      console.error('Erro persistFotoOrder:', err)
      toast.error('Erro ao salvar ordem: ' + (err.message || ''))
    }
  }

  async function setFotoPrincipal(fotoId: string) {
    if (!id) return
    try {
      // Tira principal de todas
      await supabase.from('imoveis_fotos').update({ principal: false }).eq('imovel_id', id)
      // Define a nova principal
      await supabase.from('imoveis_fotos').update({ principal: true }).eq('id', fotoId)
      setFotosExistentes(prev => prev.map(f => ({ ...f, principal: f.id === fotoId })))
      toast.success('Foto principal definida')
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''))
    }
  }

  function nomeArquivoFoto(idx: number, url: string) {
    const ext = (url.split('?')[0].match(/\.([a-zA-Z0-9]+)$/)?.[1] || 'jpg').toLowerCase()
    const base = (codigo || 'imovel').replace(/[^a-zA-Z0-9-_]/g, '')
    return `${base}-foto-${String(idx + 1).padStart(2, '0')}.${ext}`
  }

  async function baixarFotoIndividual(idx: number) {
    const foto = fotosExistentes[idx]
    if (!foto) return
    const url = foto.url_watermark || foto.url
    if (!url) { toast.error('Foto sem URL'); return }
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = nomeArquivoFoto(idx, url)
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    } catch (err: any) {
      toast.error('Erro ao baixar: ' + (err.message || ''))
    }
  }

  async function baixarTodasFotos() {
    if (fotosExistentes.length === 0) return
    setBaixandoZip(true)
    try {
      const zip = new JSZip()
      let ok = 0
      let fail = 0
      await Promise.all(
        fotosExistentes.map(async (foto, idx) => {
          const url = foto.url_watermark || foto.url
          if (!url) { fail++; return }
          try {
            const res = await fetch(url)
            const blob = await res.blob()
            zip.file(nomeArquivoFoto(idx, url), blob)
            ok++
          } catch {
            fail++
          }
        })
      )
      if (ok === 0) { toast.error('Nenhuma foto pôde ser baixada'); return }
      const content = await zip.generateAsync({ type: 'blob' })
      const blobUrl = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${(codigo || 'imovel').replace(/[^a-zA-Z0-9-_]/g, '')}-fotos.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
      toast.success(`${ok} foto(s) baixada(s)${fail ? ` · ${fail} falha(s)` : ''}`)
    } catch (err: any) {
      toast.error('Erro ao gerar zip: ' + (err.message || ''))
    } finally {
      setBaixandoZip(false)
    }
  }

  async function uploadNovasFotos() {
    if (novasFotos.length === 0 || !id) return
    setUploadingFotos(true)
    const startOrdem = fotosExistentes.length
    for (let i = 0; i < novasFotos.length; i++) {
      const foto = novasFotos[i]
      try {
        const result = await uploadFotoComWatermark(foto.file, id, i)
        if (result) {
          await supabase.from('imoveis_fotos').insert({
            imovel_id: id,
            url: result.url,
            url_watermark: result.url_watermark,
            url_thumb: result.url_thumb,
            principal: foto.principal,
            ordem: startOrdem + i,
          })
        }
      } catch (err) {
        console.error(`Erro foto ${i + 1}:`, err)
      }
    }
    setUploadingFotos(false)
    setNovasFotos([])
  }

  // ── Proprietário save ──
  async function saveProprietario() {
    if (!id || !proprietario.nome) return
    setSavingProprietario(true)
    try {
      if (proprietario.id) {
        await supabase.from('imoveis_proprietarios').update({
          nome: proprietario.nome,
          cpf_cnpj: proprietario.cpf_cnpj || null,
          telefone: proprietario.telefone || null,
          email: proprietario.email || null,
          endereco: proprietario.endereco || null,
          observacoes: proprietario.observacoes || null,
        }).eq('id', proprietario.id)
      } else {
        const { data: inserted } = await supabase.from('imoveis_proprietarios').insert({
          imovel_id: id,
          nome: proprietario.nome,
          cpf_cnpj: proprietario.cpf_cnpj || null,
          telefone: proprietario.telefone || null,
          email: proprietario.email || null,
          endereco: proprietario.endereco || null,
          observacoes: proprietario.observacoes || null,
        }).select('id').single()
        if (inserted) setProprietario(p => ({ ...p, id: inserted.id }))
      }
      toast.success('Proprietário salvo!')
    } catch (err) {
      console.error('Erro ao salvar proprietário:', err)
      toast.error('Erro ao salvar proprietário')
    } finally {
      setSavingProprietario(false)
    }
  }

  // ── Documentos upload ──
  function handleDocFiles(files: FileList | File[]) {
    const newDocs = Array.from(files).map(file => ({
      file,
      tipo: 'outro',
      observacoes: '',
    }))
    setNovosDocumentos(prev => [...prev, ...newDocs])
  }

  function removeNovoDoc(index: number) {
    setNovosDocumentos(prev => prev.filter((_, i) => i !== index))
  }

  async function uploadNovosDocumentos() {
    if (!id || novosDocumentos.length === 0) return
    setUploadingDocs(true)
    for (const doc of novosDocumentos) {
      try {
        const ts = Date.now()
        const ext = doc.file.name.split('.').pop() || 'pdf'
        const path = `${id}/${doc.tipo}/${ts}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('documentos')
          .upload(path, doc.file, { contentType: doc.file.type, upsert: true })
        if (upErr) { console.error('Erro upload doc:', upErr); continue }
        const fullPath = `documentos/${path}`
        await supabase.from('imoveis_documentos').insert({
          imovel_id: id,
          tipo: doc.tipo,
          nome_arquivo: doc.file.name,
          url: fullPath,
          observacoes: doc.observacoes || null,
          uploaded_by: profile?.id,
        })
      } catch (err) {
        console.error('Erro doc:', err)
      }
    }
    // Refresh lista
    const { data: docsData } = await supabase
      .from('imoveis_documentos')
      .select('id, tipo, nome_arquivo, url, created_at')
      .eq('imovel_id', id)
      .order('created_at')
    setDocsExistentes(docsData || [])
    setNovosDocumentos([])
    setUploadingDocs(false)
    toast.success('Documentos enviados!')
  }

  async function removeDocExistente(docId: string, url: string) {
    try {
      // Remove do storage (extrair path sem o bucket prefix)
      const storagePath = url.replace('documentos/', '')
      await supabase.storage.from('documentos').remove([storagePath])
      await supabase.from('imoveis_documentos').delete().eq('id', docId)
      setDocsExistentes(prev => prev.filter(d => d.id !== docId))
      toast.success('Documento removido')
    } catch (err) {
      console.error('Erro ao remover documento:', err)
      toast.error('Erro ao remover documento')
    }
  }

  async function downloadDoc(url: string, nomeArquivo: string) {
    try {
      const storagePath = url.replace('documentos/', '')
      const { data, error } = await supabase.storage.from('documentos').download(storagePath)
      if (error) throw error
      const blobUrl = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = nomeArquivo
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Erro download:', err)
      toast.error('Erro ao baixar documento')
    }
  }

  // ── Review workflow actions ──
  async function handleReviewAction() {
    if (!id || !reviewAction) return
    if ((reviewAction === 'devolver' || reviewAction === 'reprovar') && !reviewText.trim()) {
      toast.error(reviewAction === 'devolver' ? 'Informe as pendências' : 'Informe o motivo da reprovação')
      return
    }

    setReviewLoading(true)
    try {
      const statusMap = {
        aprovar: 'aprovado' as ImovelStatus,
        devolver: 'em_correcao' as ImovelStatus,
        reprovar: 'reprovado' as ImovelStatus,
      }
      const acaoMap = { aprovar: 'aprovado', devolver: 'devolvido', reprovar: 'reprovado' }

      // Update imovel status
      const { error: updateError } = await supabase
        .from('imoveis')
        .update({ status: statusMap[reviewAction] })
        .eq('id', id)
      if (updateError) throw updateError

      // Create revisao record
      const { error: revisaoError } = await supabase.from('imoveis_revisoes').insert({
        imovel_id: id,
        revisor_id: profile?.id,
        acao: acaoMap[reviewAction],
        pendencias: reviewAction === 'devolver' ? reviewText.trim() : null,
        observacoes: reviewAction === 'reprovar' ? reviewText.trim() : (reviewAction === 'aprovar' ? (reviewText.trim() || 'Imóvel aprovado') : null),
      })
      if (revisaoError) throw revisaoError

      // Send notification to corretor
      if (corretorId) {
        const mensagemMap = {
          aprovar: `Seu imóvel ${codigo} foi aprovado!`,
          devolver: `Seu imóvel ${codigo} foi devolvido para correção. Verifique as pendências.`,
          reprovar: `Seu imóvel ${codigo} foi reprovado. Verifique o motivo.`,
        }
        await supabase.from('notificacoes').insert({
          user_id: corretorId,
          titulo: reviewAction === 'aprovar' ? 'Imóvel Aprovado' : reviewAction === 'devolver' ? 'Correção Necessária' : 'Imóvel Reprovado',
          mensagem: mensagemMap[reviewAction],
          tipo: 'revisao',
          link: `/painel/imoveis/${id}`,
        })
      }

      const labels = { aprovar: 'aprovado', devolver: 'devolvido para correção', reprovar: 'reprovado' }
      toast.success(`Imóvel ${labels[reviewAction]} com sucesso!`)
      setReviewAction(null)
      setReviewText('')
      navigate('/painel/imoveis')
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setReviewLoading(false)
    }
  }

  // Corretor: reenviar para revisão
  async function handleReenviarRevisao() {
    if (!id) return
    setReviewLoading(true)
    try {
      const { error: updateError } = await supabase
        .from('imoveis')
        .update({ status: 'enviado_revisao' })
        .eq('id', id)
      if (updateError) throw updateError

      await supabase.from('imoveis_revisoes').insert({
        imovel_id: id,
        revisor_id: profile?.id,
        acao: 'corrigido',
        observacoes: 'Imóvel reenviado após correção',
      })

      // Notify admins
      const { data: admins } = await supabase
        .from('users_profiles')
        .select('id')
        .in('role_id', (await supabase.from('roles').select('id').in('nome', ['superadmin', 'gestor'])).data?.map(r => r.id) || [])
      for (const admin of admins || []) {
        await supabase.from('notificacoes').insert({
          user_id: admin.id,
          titulo: 'Imóvel Reenviado',
          mensagem: `O imóvel ${codigo} foi reenviado para revisão após correção.`,
          tipo: 'revisao',
          link: `/painel/imoveis/${id}`,
        })
      }

      toast.success('Imóvel reenviado para revisão!')
      navigate('/painel/imoveis')
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setReviewLoading(false)
    }
  }

  // Admin: publicar (only approved)
  async function handlePublicar() {
    if (!id) return
    try {
      const { error } = await supabase.from('imoveis').update({ status: 'publicado' }).eq('id', id)
      if (error) throw error
      toast.success('Imóvel publicado!')
      navigate('/painel/imoveis')
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || 'Erro desconhecido'))
    }
  }

  // Admin: pausar / despausar
  async function handlePausarDespausar(acao: 'pausar' | 'despausar') {
    if (!id) return
    const novoStatus = acao === 'pausar' ? 'pausado' : 'publicado'
    try {
      const { error } = await supabase.from('imoveis').update({ status: novoStatus }).eq('id', id)
      if (error) throw error
      await supabase.from('imoveis_revisoes').insert({
        imovel_id: id,
        revisor_id: profile?.id,
        acao: acao === 'pausar' ? 'pausado' : 'despausado',
        observacoes: acao === 'pausar' ? 'Imóvel pausado' : 'Imóvel despausado',
      })
      toast.success(acao === 'pausar' ? 'Imóvel pausado!' : 'Imóvel despausado!')
      navigate('/painel/imoveis')
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || 'Erro desconhecido'))
    }
  }

  // Corretor: enviar para revisão
  async function handleEnviarRevisao() {
    if (!id) return
    setReviewLoading(true)
    try {
      // Save form data first
      const data = getValues()
      const slug = generateSlug(data.titulo)
      const { error: updateError } = await supabase
        .from('imoveis')
        .update({
          titulo: data.titulo,
          descricao: data.descricao,
          slug,
          tipo: data.tipo,
          finalidade: data.finalidade,
          status: 'enviado_revisao',
          cep: data.cep || null,
          endereco: data.endereco || null,
          numero: data.numero || null,
          complemento: data.complemento || null,
          bairro_id: data.bairro,
          cidade: data.cidade,
          estado: data.estado,
          preco: data.preco,
          preco_condominio: data.condominio || null,
          preco_iptu: data.iptu_anual || null,
          area_total: data.area_total || null,
          area_construida: data.area_construida || null,
          quartos: data.quartos,
          suites: data.suites,
          banheiros: data.banheiros,
          vagas_garagem: data.vagas,
          caracteristicas: data.caracteristicas || [],
          tour_virtual_url: data.tour_virtual_url || null,
          video_url: data.video_url || null,
          destaque: data.destaque,
          corretor_id: data.corretor_id || profile?.id,
        })
        .eq('id', id)
      if (updateError) throw updateError

      if (novasFotos.length > 0) {
        await uploadNovasFotos()
      }

      await supabase.from('imoveis_revisoes').insert({
        imovel_id: id,
        revisor_id: profile?.id,
        acao: 'enviado',
        observacoes: 'Imóvel enviado para revisão',
      })

      // Notify admins
      const { data: adminRoles } = await supabase.from('roles').select('id').in('nome', ['superadmin', 'gestor'])
      const { data: admins } = await supabase
        .from('users_profiles')
        .select('id')
        .in('role_id', adminRoles?.map(r => r.id) || [])
      for (const admin of admins || []) {
        await supabase.from('notificacoes').insert({
          user_id: admin.id,
          titulo: 'Novo Imóvel para Revisão',
          mensagem: `O imóvel ${codigo || data.titulo} foi enviado para revisão.`,
          tipo: 'revisao',
          link: `/painel/imoveis/${id}`,
        })
      }

      toast.success('Imóvel enviado para revisão!')
      navigate('/painel/imoveis')
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setReviewLoading(false)
    }
  }

  const onSubmit: SubmitHandler<ImovelFormData> = async (data) => {
    try {
      const slug = generateSlug(data.titulo)
      const { error } = await supabase
        .from('imoveis')
        .update({
          titulo: data.titulo,
          descricao: data.descricao,
          slug,
          tipo: data.tipo,
          finalidade: data.finalidade,
          status: isAdmin ? data.status : currentStatus,
          cep: data.cep || null,
          endereco: data.endereco || null,
          numero: data.numero || null,
          complemento: data.complemento || null,
          bairro_id: data.bairro,
          cidade: data.cidade,
          estado: data.estado,
          preco: data.preco,
          preco_condominio: data.condominio || null,
          preco_iptu: data.iptu_anual || null,
          area_total: data.area_total || null,
          area_construida: data.area_construida || null,
          quartos: data.quartos,
          suites: data.suites,
          banheiros: data.banheiros,
          vagas_garagem: data.vagas,
          caracteristicas: data.caracteristicas || [],
          tour_virtual_url: data.tour_virtual_url || null,
          video_url: data.video_url || null,
          destaque: data.destaque,
          corretor_id: data.corretor_id || profile?.id,
        })
        .eq('id', id!)

      if (error) throw error

      // Persiste a ordem das fotos existentes (caso o usuário tenha reordenado)
      if (fotosExistentes.length > 0) {
        const updates = await Promise.all(
          fotosExistentes.map((f, i) =>
            supabase.from('imoveis_fotos').update({ ordem: i }).eq('id', f.id)
          )
        )
        const failed = updates.filter(u => u.error)
        if (failed.length > 0) {
          console.error('Erros ao salvar ordem:', failed.map(u => u.error))
          toast.error(`${failed.length} foto(s) com erro ao salvar ordem · ${failed[0].error?.message || ''}`)
        }
      }

      // Upload novas fotos se houver
      if (novasFotos.length > 0) {
        await uploadNovasFotos()
      }

      toast.success('Imóvel atualizado com sucesso!')
      navigate('/painel/imoveis')
    } catch (err: any) {
      toast.error('Erro ao atualizar imóvel: ' + (err.message || 'Erro desconhecido'))
    }
  }

  async function handleSaveDraft() {
    const data = getValues()
    setSavingDraft(true)
    try {
      const slug = generateSlug(data.titulo)
      const { error } = await supabase
        .from('imoveis')
        .update({
          titulo: data.titulo,
          descricao: data.descricao,
          slug,
          tipo: data.tipo,
          finalidade: data.finalidade,
          status: 'rascunho',
          cep: data.cep || null,
          endereco: data.endereco || null,
          numero: data.numero || null,
          complemento: data.complemento || null,
          bairro_id: data.bairro,
          cidade: data.cidade,
          estado: data.estado,
          preco: data.preco,
          preco_condominio: data.condominio || null,
          preco_iptu: data.iptu_anual || null,
          area_total: data.area_total || null,
          area_construida: data.area_construida || null,
          quartos: data.quartos,
          suites: data.suites,
          banheiros: data.banheiros,
          vagas_garagem: data.vagas,
          caracteristicas: data.caracteristicas || [],
          tour_virtual_url: data.tour_virtual_url || null,
          video_url: data.video_url || null,
          destaque: data.destaque,
          corretor_id: data.corretor_id || profile?.id,
        })
        .eq('id', id!)

      if (error) throw error

      if (novasFotos.length > 0) {
        await uploadNovasFotos()
      }

      toast.success('Rascunho salvo!')
      navigate('/painel/imoveis')
    } catch (err: any) {
      toast.error('Erro ao salvar rascunho: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setSavingDraft(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('imoveis')
        .delete()
        .eq('id', id!)

      if (error) throw error

      toast.success('Imóvel excluído.')
      setShowDeleteDialog(false)
      navigate('/painel/imoveis')
    } catch (err: any) {
      toast.error('Erro ao excluir imóvel: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setDeleting(false)
    }
  }

  // Get last pendencias for em_correcao
  const lastPendencias = revisoes.find(r => r.acao === 'devolvido')

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-moradda-blue-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/painel/imoveis"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Editar Imóvel
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {codigo}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {id && (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/40"
            >
              <Share2 size={16} />
              Compartilhar
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 size={16} />
              Excluir Imóvel
            </button>
          )}
        </div>
      </div>

      {/* ── Review Panel: Admin reviewing (status = enviado_revisao) ── */}
      {isAdmin && currentStatus === 'enviado_revisao' && (
        <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-6 dark:border-blue-700 dark:bg-blue-900/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
              <ClipboardCheck size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                Este imóvel está aguardando revisão
              </h2>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Analise as informações e tome uma decisão
              </p>
            </div>
          </div>

          {!reviewAction && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setReviewAction('aprovar')}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                <CheckCircle2 size={16} />
                Aprovar
              </button>
              <button
                type="button"
                onClick={() => setReviewAction('devolver')}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                <RotateCcw size={16} />
                Devolver para Correção
              </button>
              <button
                type="button"
                onClick={() => setReviewAction('reprovar')}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <XCircle size={16} />
                Reprovar
              </button>
            </div>
          )}

          {reviewAction && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-blue-800 dark:text-blue-200">
                  {reviewAction === 'devolver'
                    ? 'Pendências (obrigatório)'
                    : reviewAction === 'reprovar'
                      ? 'Motivo da reprovação (obrigatório)'
                      : 'Observações (opcional)'}
                </label>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={
                    reviewAction === 'devolver'
                      ? 'Descreva as pendências que precisam ser corrigidas...'
                      : reviewAction === 'reprovar'
                        ? 'Informe o motivo da reprovação...'
                        : 'Adicione observações sobre a aprovação...'
                  }
                  className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-blue-600 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReviewAction}
                  disabled={reviewLoading}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${
                    reviewAction === 'aprovar'
                      ? 'bg-teal-600 hover:bg-teal-700'
                      : reviewAction === 'devolver'
                        ? 'bg-orange-500 hover:bg-orange-600'
                        : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {reviewLoading && <Loader2 size={14} className="animate-spin" />}
                  {reviewAction === 'aprovar' ? 'Confirmar Aprovação' : reviewAction === 'devolver' ? 'Confirmar Devolução' : 'Confirmar Reprovação'}
                </button>
                <button
                  type="button"
                  onClick={() => { setReviewAction(null); setReviewText('') }}
                  className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Correction Panel: Corretor viewing (status = em_correcao) ── */}
      {isCorretor && currentStatus === 'em_correcao' && (
        <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-6 dark:border-orange-700 dark:bg-orange-900/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40">
              <RotateCcw size={20} className="text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                Este imóvel foi devolvido para correção
              </h2>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Corrija as pendências abaixo e reenvie para revisão
              </p>
            </div>
          </div>

          {lastPendencias && (
            <div className="mb-4 rounded-lg border border-orange-200 bg-white p-4 dark:border-orange-700 dark:bg-gray-800">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                Pendências
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {lastPendencias.pendencias}
              </p>
              {lastPendencias.observacoes && (
                <>
                  <p className="mt-2 mb-1 text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                    Observações
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {lastPendencias.observacoes}
                  </p>
                </>
              )}
              <p className="mt-2 text-xs text-gray-400">
                Por {lastPendencias.revisor_nome} em {formatDateTime(lastPendencias.created_at)}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleReenviarRevisao}
            disabled={reviewLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {reviewLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Reenviar para Revisão
          </button>
        </div>
      )}

      {/* ── Quick action buttons for admin ── */}
      {isAdmin && currentStatus === 'aprovado' && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-teal-600 dark:text-teal-400" />
              <p className="text-sm font-semibold text-teal-800 dark:text-teal-200">
                Este imóvel está aprovado e pronto para publicação
              </p>
            </div>
            <button
              type="button"
              onClick={handlePublicar}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              <Eye size={16} />
              Publicar
            </button>
          </div>
        </div>
      )}

      {isAdmin && currentStatus === 'publicado' && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-green-600 dark:text-green-400" />
              <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                Este imóvel está publicado
              </p>
            </div>
            <button
              type="button"
              onClick={() => handlePausarDespausar('pausar')}
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-yellow-600"
            >
              <Pause size={16} />
              Pausar
            </button>
          </div>
        </div>
      )}

      {isAdmin && currentStatus === 'pausado' && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Pause size={20} className="text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                Este imóvel está pausado
              </p>
            </div>
            <button
              type="button"
              onClick={() => handlePausarDespausar('despausar')}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              <Play size={16} />
              Despausar
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        {/* Status change — admin only */}
        {isAdmin && (
          <SectionCard title="Status do Imóvel">
            <div className="max-w-xs">
              <label className={labelClass}>Status</label>
              <select className={inputClass} {...register('status')}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </SectionCard>
        )}

        {/* Section 1: Informações Básicas */}
        <SectionCard title="Informações Básicas">
          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Casa com 3 quartos no Jardim Jalisco"
                className={inputClass}
                {...register('titulo')}
              />
              <FieldError message={errors.titulo?.message} />
            </div>
            <div>
              <label className={labelClass}>
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Descreva o imóvel em detalhes..."
                className={inputClass}
                {...register('descricao')}
              />
              <FieldError message={errors.descricao?.message} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Tipo</label>
                <select className={inputClass} {...register('tipo')}>
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Finalidade</label>
                <select className={inputClass} {...register('finalidade')}>
                  {FINALIDADES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Section 2: Localização */}
        <SectionCard title="Localização">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>CEP</label>
                <input
                  type="text"
                  placeholder="00000-000"
                  className={inputClass}
                  {...register('cep')}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Endereço</label>
                <input
                  type="text"
                  placeholder="Rua, Avenida..."
                  className={inputClass}
                  {...register('endereco')}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Número</label>
                <input
                  type="text"
                  placeholder="123"
                  className={inputClass}
                  {...register('numero')}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Complemento</label>
                <input
                  type="text"
                  placeholder="Apto 101, Bloco A..."
                  className={inputClass}
                  {...register('complemento')}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>
                  Bairro <span className="text-red-500">*</span>
                </label>
                <select className={inputClass} {...register('bairro')}>
                  <option value="">Selecione...</option>
                  {bairros.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nome}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.bairro?.message} />
              </div>
              <div>
                <label className={labelClass}>Cidade</label>
                <input
                  type="text"
                  className={inputClass}
                  {...register('cidade')}
                />
              </div>
              <div>
                <label className={labelClass}>Estado</label>
                <input
                  type="text"
                  className={inputClass}
                  {...register('estado')}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Section 3: Valores */}
        <SectionCard title="Valores">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>
                Preço (R$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                className={inputClass}
                {...register('preco')}
              />
              <FieldError message={errors.preco?.message} />
            </div>
            <div>
              <label className={labelClass}>Condomínio (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                className={inputClass}
                {...register('condominio')}
              />
            </div>
            <div>
              <label className={labelClass}>IPTU Anual (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                className={inputClass}
                {...register('iptu_anual')}
              />
            </div>
          </div>
        </SectionCard>

        {/* Section 4: Características */}
        <SectionCard title="Características">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className={labelClass}>Quartos</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  {...register('quartos')}
                />
              </div>
              <div>
                <label className={labelClass}>Suítes</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  {...register('suites')}
                />
              </div>
              <div>
                <label className={labelClass}>Banheiros</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  {...register('banheiros')}
                />
              </div>
              <div>
                <label className={labelClass}>Vagas</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  {...register('vagas')}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Área Total (m²)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  className={inputClass}
                  {...register('area_total')}
                />
              </div>
              <div>
                <label className={labelClass}>Área Construída (m²)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  className={inputClass}
                  {...register('area_construida')}
                />
              </div>
            </div>
            {/* Extras checkboxes */}
            <div>
              <label className={labelClass}>Características Extras</label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {CARACTERISTICAS.map((item) => (
                  <label
                    key={item}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm transition hover:border-moradda-blue-300 hover:bg-moradda-blue-50 dark:border-gray-600 dark:hover:border-moradda-blue-500 dark:hover:bg-moradda-blue-900/20"
                  >
                    <input
                      type="checkbox"
                      checked={caracteristicasWatch?.includes(item) || false}
                      onChange={() => toggleCaracteristica(item)}
                      className="h-4 w-4 rounded border-gray-300 text-moradda-blue-600 focus:ring-moradda-blue-500 dark:border-gray-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Section 5: Mídia */}
        <SectionCard title="Mídia">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Tour Virtual URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  className={inputClass}
                  {...register('tour_virtual_url')}
                />
              </div>
              <div>
                <label className={labelClass}>Vídeo URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  className={inputClass}
                  {...register('video_url')}
                />
              </div>
            </div>
            {/* Destaque toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={destaqueWatch}
                onClick={() => setValue('destaque', !destaqueWatch)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  destaqueWatch
                    ? 'bg-moradda-gold-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    destaqueWatch ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Marcar como destaque
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Section 6: Fotos */}
        <SectionCard title="Fotos">
          {/* Fotos existentes · drag and drop pra reordenar */}
          {fotosExistentes.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Fotos atuais · arraste pra reordenar · clique em ★ pra definir como principal
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={baixarTodasFotos}
                    disabled={baixandoZip}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    {baixandoZip ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    {baixandoZip ? 'Compactando...' : `Baixar todas (${fotosExistentes.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={persistFotoOrder}
                    className="rounded-md bg-moradda-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-moradda-blue-600"
                  >
                    Salvar ordem
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {fotosExistentes.map((foto, idx) => (
                  <div
                    key={foto.id}
                    draggable
                    onDragStart={() => setDraggingFotoIdx(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (draggingFotoIdx !== null) reorderFotos(draggingFotoIdx, idx)
                      setDraggingFotoIdx(null)
                    }}
                    onDragEnd={() => setDraggingFotoIdx(null)}
                    className={`group relative cursor-move overflow-hidden rounded-lg border-2 transition ${
                      draggingFotoIdx === idx
                        ? 'border-moradda-blue-500 opacity-50 scale-95'
                        : 'border-gray-200 dark:border-gray-700 hover:border-moradda-blue-400'
                    }`}
                  >
                    <img src={foto.url_watermark} alt="" className="aspect-square w-full object-cover pointer-events-none" />
                    {/* Número da posição */}
                    <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white">
                      {idx + 1}
                    </div>
                    {/* Overlay hover */}
                    <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/40" />
                    {/* Botões topo direito */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                      {!foto.principal && (
                        <button
                          type="button"
                          onClick={() => setFotoPrincipal(foto.id)}
                          className="rounded-md bg-yellow-500 px-2 py-1 text-xs font-medium text-white hover:bg-yellow-600"
                          title="Definir como principal"
                        >
                          ★
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => baixarFotoIndividual(idx)}
                        className="rounded-md bg-moradda-blue-500 px-2 py-1 text-xs font-medium text-white hover:bg-moradda-blue-600"
                        title="Baixar foto"
                      >
                        <Download size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFotoExistente(foto.id)}
                        className="rounded-md bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                      >
                        Remover
                      </button>
                    </div>
                    {/* Badge Principal */}
                    {foto.principal && (
                      <div className="absolute bottom-2 left-2 rounded-md bg-moradda-gold-400 px-2 py-0.5 text-xs font-semibold text-white">
                        ★ Principal
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload novas fotos */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files) }}
            onClick={() => document.getElementById('foto-input-edit')?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition ${
              isDragOver
                ? 'border-moradda-blue-500 bg-moradda-blue-50 dark:bg-moradda-blue-900/20'
                : 'border-gray-300 bg-gray-50 hover:border-moradda-blue-400 dark:border-gray-600 dark:bg-gray-700/50'
            }`}
          >
            <Upload size={28} className="mb-2 text-gray-400 dark:text-gray-500" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Adicionar novas fotos
            </p>
            <p className="mt-1 text-xs text-gray-400">PNG, JPG ou WEBP (máx. 5MB cada)</p>
            <input
              id="foto-input-edit"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }}
            />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <ImageIcon size={14} />
            As fotos receberão marca d'água automática da Moradda
          </p>

          {/* Preview novas fotos */}
          {novasFotos.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Novas fotos ({novasFotos.length})</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {novasFotos.map((foto, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-lg border border-moradda-blue-200 dark:border-moradda-blue-700">
                    <img src={foto.preview} alt={`Nova ${i + 1}`} className="aspect-square w-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/40" />
                    <div className="absolute top-2 right-2 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => removeNovaFoto(i)}
                        className="rounded-md bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 rounded-md bg-moradda-blue-500 px-2 py-0.5 text-xs font-semibold text-white">
                      Nova
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {uploadingFotos && (
            <div className="mt-3 flex items-center gap-2 text-sm text-moradda-blue-500">
              <Loader2 size={16} className="animate-spin" />
              Aplicando marca d'água e enviando fotos...
            </div>
          )}
        </SectionCard>

        {/* Section 7: Proprietário (interno) */}
        <SectionCard title="Proprietário do Imóvel">
          <p className="mb-4 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <UserCircle size={14} />
            Dados internos — não serão exibidos no site
          </p>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Nome do Proprietário</label>
                <input
                  type="text"
                  placeholder="Nome completo"
                  className={inputClass}
                  value={proprietario.nome}
                  onChange={e => setProprietario(p => ({ ...p, nome: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>CPF / CNPJ</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  className={inputClass}
                  value={proprietario.cpf_cnpj}
                  onChange={e => setProprietario(p => ({ ...p, cpf_cnpj: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Telefone</label>
                <input
                  type="tel"
                  placeholder="(24) 99999-9999"
                  className={inputClass}
                  value={proprietario.telefone}
                  onChange={e => setProprietario(p => ({ ...p, telefone: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>E-mail</label>
                <input
                  type="email"
                  placeholder="proprietario@email.com"
                  className={inputClass}
                  value={proprietario.email}
                  onChange={e => setProprietario(p => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Endereço do Proprietário</label>
              <input
                type="text"
                placeholder="Endereço completo do proprietário"
                className={inputClass}
                value={proprietario.endereco}
                onChange={e => setProprietario(p => ({ ...p, endereco: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Observações</label>
              <textarea
                rows={2}
                placeholder="Notas internas sobre o proprietário..."
                className={inputClass}
                value={proprietario.observacoes}
                onChange={e => setProprietario(p => ({ ...p, observacoes: e.target.value }))}
              />
            </div>
            <button
              type="button"
              onClick={saveProprietario}
              disabled={savingProprietario || !proprietario.nome}
              className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-moradda-blue-600 disabled:opacity-50"
            >
              {savingProprietario ? <Loader2 size={14} className="animate-spin" /> : <UserCircle size={16} />}
              {proprietario.id ? 'Atualizar Proprietário' : 'Salvar Proprietário'}
            </button>
          </div>
        </SectionCard>

        {/* Section 8: Documentos (interno) */}
        <SectionCard title="Documentos do Imóvel">
          <p className="mb-4 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <FileText size={14} />
            Arquivos internos para cadastro — não serão exibidos no site
          </p>

          {/* Documentos existentes */}
          {docsExistentes.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Documentos cadastrados ({docsExistentes.length})
              </p>
              {docsExistentes.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                  <FileText size={20} className="shrink-0 text-moradda-blue-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                      {doc.nome_arquivo}
                    </p>
                    <p className="text-xs text-gray-400">
                      {TIPOS_DOCUMENTO.find(t => t.value === doc.tipo)?.label || doc.tipo}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadDoc(doc.url, doc.nome_arquivo)}
                    className="rounded-lg p-1.5 text-moradda-blue-500 transition hover:bg-moradda-blue-50 dark:hover:bg-moradda-blue-900/20"
                    title="Baixar"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeDocExistente(doc.id, doc.url)}
                    className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    title="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload novos documentos */}
          <div
            onClick={() => document.getElementById('doc-input-edit')?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 transition hover:border-moradda-blue-400 hover:bg-moradda-blue-50/50 dark:border-gray-600 dark:bg-gray-700/50"
          >
            <Upload size={28} className="mb-2 text-gray-400 dark:text-gray-500" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Clique para adicionar documentos
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              PDF, DOC, JPG, PNG (máx. 10MB cada)
            </p>
            <input
              id="doc-input-edit"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleDocFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>
          {novosDocumentos.length > 0 && (
            <div className="mt-4 space-y-3">
              {novosDocumentos.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-moradda-blue-200 bg-white p-3 dark:border-moradda-blue-700 dark:bg-gray-800">
                  <FileText size={20} className="shrink-0 text-moradda-blue-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                      {doc.file.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <select
                    value={doc.tipo}
                    onChange={e => setNovosDocumentos(prev => prev.map((d, idx) => idx === i ? { ...d, tipo: e.target.value } : d))}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {TIPOS_DOCUMENTO.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeNovoDoc(i)}
                    className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={uploadNovosDocumentos}
                disabled={uploadingDocs}
                className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-moradda-blue-600 disabled:opacity-50"
              >
                {uploadingDocs ? <Loader2 size={14} className="animate-spin" /> : <Upload size={16} />}
                {uploadingDocs ? 'Enviando...' : `Enviar ${novosDocumentos.length} documento${novosDocumentos.length > 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </SectionCard>

        {/* Section 9: Corretor Responsável */}
        {isAdmin && (
          <SectionCard title="Corretor Responsável">
            <div>
              <label className={labelClass}>Corretor</label>
              <select className={inputClass} {...register('corretor_id')}>
                <option value="">Selecione um corretor...</option>
                {corretores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </SectionCard>
        )}

        {/* Footer buttons */}
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/painel/imoveis"
            className="text-center text-sm font-medium text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cancelar
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Corretor: Save draft + Send for review */}
            {isCorretor && (currentStatus === 'rascunho' || currentStatus === 'em_correcao' || currentStatus === 'reprovado') && (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={savingDraft}
                  className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {savingDraft ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Salvando...
                    </span>
                  ) : (
                    'Salvar como Rascunho'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleEnviarRevisao}
                  disabled={reviewLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-moradda-gold-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-moradda-gold-600 disabled:opacity-50"
                >
                  {reviewLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={16} />}
                  Enviar para Revisão
                </button>
              </>
            )}

            {/* Admin: full save + draft */}
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={savingDraft}
                  className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {savingDraft ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Salvando...
                    </span>
                  ) : (
                    'Salvar como Rascunho'
                  )}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-moradda-gold-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-moradda-gold-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Atualizando...' : 'Atualizar'}
                </button>
              </>
            )}
          </div>
        </div>
      </form>

      {/* ── Review History Timeline ── */}
      {revisoes.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
            <Clock size={20} />
            Histórico de Revisões
          </h2>
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />
            {revisoes.map((revisao, index) => {
              const cfg = ACAO_CONFIG[revisao.acao] || { label: revisao.acao, color: 'text-gray-600 dark:text-gray-400', icon: 'default' }
              return (
                <div key={revisao.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Timeline dot */}
                  <div className={`relative z-10 mt-1 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 border-white bg-gray-100 dark:border-gray-800 dark:bg-gray-700 ${index === 0 ? 'ring-2 ring-moradda-blue-200 dark:ring-moradda-blue-800' : ''}`}>
                    {revisao.acao === 'enviado' || revisao.acao === 'corrigido' ? (
                      <Send size={12} className="text-blue-500" />
                    ) : revisao.acao === 'aprovado' ? (
                      <CheckCircle2 size={12} className="text-teal-500" />
                    ) : revisao.acao === 'devolvido' ? (
                      <RotateCcw size={12} className="text-orange-500" />
                    ) : revisao.acao === 'reprovado' ? (
                      <XCircle size={12} className="text-red-500" />
                    ) : revisao.acao === 'pausado' ? (
                      <Pause size={12} className="text-yellow-500" />
                    ) : revisao.acao === 'despausado' ? (
                      <Play size={12} className="text-green-500" />
                    ) : (
                      <Clock size={12} className="text-gray-400" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${cfg.color}`}>
                      {cfg.label}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {revisao.revisor_nome} &middot; {formatDateTime(revisao.created_at)}
                    </p>
                    {revisao.pendencias && (
                      <div className="mt-2 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
                        <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">Pendências</p>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{revisao.pendencias}</p>
                      </div>
                    )}
                    {revisao.observacoes && (
                      <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Observações</p>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{revisao.observacoes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Excluir imóvel
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Tem certeza que deseja excluir o imóvel{' '}
              <strong>{codigo}</strong>? Todas as fotos e dados
              associados serão removidos permanentemente. Esta ação não pode
              ser desfeita.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Excluindo...' : 'Excluir permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {id && (
        <ShareImovelModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          imovelId={id}
        />
      )}
    </div>
  )
}
