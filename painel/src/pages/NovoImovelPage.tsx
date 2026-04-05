import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Upload, ImageIcon, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { uploadFotoComWatermark } from '@/lib/watermark'
import { supabase } from '@/lib/supabase'

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

  cep: z.string().optional(),
  endereco: z.string().min(3, 'Endereço é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
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
export default function NovoImovelPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const isAdmin = profile?.role === 'superadmin' || profile?.role === 'gestor'

  const [isDragOver, setIsDragOver] = useState(false)
  const [bairros, setBairros] = useState<{ id: string; nome: string }[]>([])
  const [corretores, setCorretores] = useState<{ id: string; nome: string }[]>([])
  const [savingDraft, setSavingDraft] = useState(false)
  const [fotos, setFotos] = useState<{ file: File; preview: string; principal: boolean }[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ImovelFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(imovelSchema) as any,
    defaultValues: {
      tipo: 'casa',
      finalidade: 'venda',
      cidade: 'Resende',
      estado: 'RJ',
      quartos: 0,
      suites: 0,
      banheiros: 0,
      vagas: 0,
      caracteristicas: [],
      destaque: false,
      corretor_id: isAdmin ? '' : profile?.id || '',
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
      .map((file, i) => ({
        file,
        preview: URL.createObjectURL(file),
        principal: fotos.length === 0 && i === 0,
      }))
    setFotos(prev => [...prev, ...newFotos])
  }

  function removeFoto(index: number) {
    setFotos(prev => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length > 0 && !next.some(f => f.principal)) {
        next[0].principal = true
      }
      return next
    })
  }

  function setPrincipal(index: number) {
    setFotos(prev => prev.map((f, i) => ({ ...f, principal: i === index })))
  }

  async function uploadFotos(imovelId: string) {
    // Processa fotos uma por uma para evitar perda por erro
    for (let i = 0; i < fotos.length; i++) {
      try {
        const foto = fotos[i]
        const result = await uploadFotoComWatermark(foto.file, imovelId, i)
        if (result) {
          await supabase.from('imoveis_fotos').insert({
            imovel_id: imovelId,
            url: result.url,
            url_watermark: result.url_watermark,
            url_thumb: result.url_thumb,
            principal: foto.principal,
            ordem: i,
          })
        }
      } catch (err) {
        console.error(`Erro na foto ${i + 1}:`, err)
        // Continua com as próximas fotos
      }
    }
  }

  async function insertImovel(data: ImovelFormData, status: string) {
    const slug = generateSlug(data.titulo)
    const { data: inserted, error } = await supabase.from('imoveis').insert({
      titulo: data.titulo,
      descricao: data.descricao,
      slug,
      tipo: data.tipo,
      finalidade: data.finalidade,
      status,
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
      codigo: '',
    }).select('id').single()
    if (error) throw error

    if (inserted && fotos.length > 0) {
      await uploadFotos(inserted.id)
    }

    return inserted
  }

  async function notifyAdmins(imovelId: string, titulo: string) {
    try {
      // Fetch admin role IDs
      const { data: adminRoles } = await supabase
        .from('roles')
        .select('id')
        .in('nome', ['superadmin', 'gestor'])

      if (!adminRoles || adminRoles.length === 0) return

      // Fetch admin users
      const { data: admins } = await supabase
        .from('users_profiles')
        .select('id')
        .in('role_id', adminRoles.map(r => r.id))

      if (!admins || admins.length === 0) return

      // Send notifications
      for (const admin of admins) {
        await supabase.from('notificacoes').insert({
          user_id: admin.id,
          titulo: 'Novo Imóvel para Revisão',
          mensagem: `O imóvel "${titulo}" foi enviado para revisão.`,
          tipo: 'revisao',
          link: `/painel/imoveis/${imovelId}`,
        })
      }
    } catch (err) {
      console.error('Erro ao enviar notificações:', err)
    }
  }

  const onSubmit: SubmitHandler<ImovelFormData> = async (data) => {
    try {
      const inserted = await insertImovel(data, 'enviado_revisao')

      if (inserted) {
        // Create imoveis_revisoes record
        await supabase.from('imoveis_revisoes').insert({
          imovel_id: inserted.id,
          revisor_id: profile?.id,
          acao: 'enviado',
          observacoes: 'Imóvel enviado para revisão',
        })

        // Notify admins
        await notifyAdmins(inserted.id, data.titulo)
      }

      toast.success('Imóvel enviado para revisão!')
      navigate('/painel/imoveis')
    } catch (err: any) {
      toast.error('Erro ao criar imóvel: ' + (err.message || 'Erro desconhecido'))
    }
  }

  async function handleSaveDraft() {
    const data = getValues()
    setSavingDraft(true)
    try {
      await insertImovel(data, 'rascunho')
      toast.success('Rascunho salvo!')
      navigate('/painel/imoveis')
    } catch (err: any) {
      toast.error('Erro ao salvar rascunho: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setSavingDraft(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/painel/imoveis"
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Novo Imóvel
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
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
                  onBlur={async (e) => {
                    const cep = e.target.value.replace(/\D/g, '')
                    if (cep.length === 8) {
                      try {
                        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
                        const data = await res.json()
                        if (!data.erro) {
                          setValue('endereco', data.logradouro || '')
                          setValue('complemento', data.complemento || '')
                          setValue('cidade', data.localidade || 'Resende')
                          setValue('estado', data.uf || 'RJ')
                        }
                      } catch {}
                    }
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Endereço <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Rua, Avenida..."
                  className={inputClass}
                  {...register('endereco')}
                />
                <FieldError message={errors.endereco?.message} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>
                  Número <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="123"
                  className={inputClass}
                  {...register('numero')}
                />
                <FieldError message={errors.numero?.message} />
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
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragOver(false)
              if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
            }}
            onClick={() => document.getElementById('foto-input')?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 transition ${
              isDragOver
                ? 'border-moradda-blue-500 bg-moradda-blue-50 dark:bg-moradda-blue-900/20'
                : 'border-gray-300 bg-gray-50 hover:border-moradda-blue-400 hover:bg-moradda-blue-50/50 dark:border-gray-600 dark:bg-gray-700/50'
            }`}
          >
            <Upload size={32} className="mb-3 text-gray-400 dark:text-gray-500" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Arraste fotos aqui ou clique para selecionar
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              PNG, JPG ou WEBP (máx. 5MB cada)
            </p>
            <input
              id="foto-input"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <ImageIcon size={14} />
            As fotos receberão marca d'água automática da Moradda
          </p>
          {fotos.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {fotos.map((foto, i) => (
                <div key={i} className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <img src={foto.preview} alt={`Foto ${i + 1}`} className="aspect-square w-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/40" />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setPrincipal(i)}
                      className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                        foto.principal
                          ? 'bg-moradda-gold-400 text-white'
                          : 'bg-white text-gray-700 hover:bg-moradda-gold-400 hover:text-white'
                      }`}
                    >
                      {foto.principal ? 'Principal' : 'Definir principal'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFoto(i)}
                      className="rounded-md bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                    >
                      ✕
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
          )}
        </SectionCard>

        {/* Section 7: Corretor Responsável */}
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
              className="inline-flex items-center gap-2 rounded-lg bg-moradda-gold-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-moradda-gold-600 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Enviar para Revisão
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
