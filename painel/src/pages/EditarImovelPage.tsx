import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Upload, ImageIcon, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { uploadFotoComWatermark } from '@/lib/watermark'

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
    'em_revisao',
    'publicado',
    'vendido',
    'alugado',
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
  | 'em_revisao'
  | 'publicado'
  | 'vendido'
  | 'alugado'
  | 'inativo'

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
  { value: 'em_revisao', label: 'Em Revisão' },
  { value: 'publicado', label: 'Publicado' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'alugado', label: 'Alugado' },
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
  const isSuperadmin = profile?.role === 'superadmin'

  const [isDragOver, setIsDragOver] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [bairros, setBairros] = useState<{ id: string; nome: string }[]>([])
  const [corretores, setCorretores] = useState<{ id: string; nome: string }[]>([])
  const [savingDraft, setSavingDraft] = useState(false)
  const [fotosExistentes, setFotosExistentes] = useState<{ id: string; url_watermark: string; principal: boolean }[]>([])
  const [novasFotos, setNovasFotos] = useState<{ file: File; preview: string; principal: boolean }[]>([])
  const [uploadingFotos, setUploadingFotos] = useState(false)

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

  // Fetch corretores for superadmin
  useEffect(() => {
    if (!isSuperadmin) return
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
  }, [isSuperadmin])

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

        // Buscar fotos existentes
        const { data: fotosData } = await supabase
          .from('imoveis_fotos')
          .select('id, url_watermark, principal, ordem')
          .eq('imovel_id', id)
          .order('ordem')
        setFotosExistentes((fotosData || []).map(f => ({ id: f.id, url_watermark: f.url_watermark || '', principal: f.principal })))

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
          status: data.status,
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
        {isSuperadmin && (
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

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        {/* Status change — superadmin only */}
        {isSuperadmin && (
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
          {/* Fotos existentes */}
          {fotosExistentes.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Fotos atuais</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {fotosExistentes.map((foto) => (
                  <div key={foto.id} className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <img src={foto.url_watermark} alt="" className="aspect-square w-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/40" />
                    <div className="absolute top-2 right-2 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => removeFotoExistente(foto.id)}
                        className="rounded-md bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                      >
                        Remover
                      </button>
                    </div>
                    {foto.principal && (
                      <div className="absolute bottom-2 left-2 rounded-md bg-moradda-gold-400 px-2 py-0.5 text-xs font-semibold text-white">
                        Principal
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

        {/* Section 7: Corretor Responsável */}
        {isSuperadmin && (
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
          </div>
        </div>
      </form>

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
    </div>
  )
}
