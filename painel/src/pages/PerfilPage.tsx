import { useState, useEffect, useRef } from 'react'
import {
  User,
  Camera,
  Save,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface ProfileForm {
  nome: string
  telefone: string
  whatsapp: string
  creci: string
  bio: string
}

interface PasswordForm {
  current: string
  newPass: string
  confirm: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function calcCompletion(form: ProfileForm, avatarUrl: string | null): { percent: number; missing: string[] } {
  const missing: string[] = []
  let percent = 0
  if (form.nome.trim()) percent += 20; else missing.push('Nome completo')
  if (form.telefone.trim()) percent += 15; else missing.push('Telefone')
  if (form.whatsapp.trim()) percent += 15; else missing.push('WhatsApp')
  if (form.creci.trim()) percent += 15; else missing.push('CRECI')
  if (form.bio.trim()) percent += 15; else missing.push('Bio / Apresentacao')
  if (avatarUrl) percent += 20; else missing.push('Foto de perfil')
  return { percent, missing }
}

export default function PerfilPage() {
  const { user, profile, refreshProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<ProfileForm>({
    nome: '',
    telefone: '',
    whatsapp: '',
    creci: '',
    bio: '',
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [slug, setSlug] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Password
  const [passForm, setPassForm] = useState<PasswordForm>({ current: '', newPass: '', confirm: '' })
  const [changingPass, setChangingPass] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        nome: profile.nome || '',
        telefone: profile.telefone || '',
        whatsapp: profile.whatsapp || '',
        creci: profile.creci || '',
        bio: profile.bio || '',
      })
      setAvatarUrl(profile.avatar_url || null)
      setSlug(profile.slug || '')
      setEmail(profile.email || user?.email || '')
      setLoading(false)
    } else if (user) {
      setEmail(user.email || '')
      setLoading(false)
    }
  }, [profile, user])

  // Update slug when name changes
  useEffect(() => {
    if (form.nome.trim()) {
      setSlug(slugify(form.nome))
    }
  }, [form.nome])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    if (name === 'bio' && value.length > 500) return
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Formato invalido. Use JPG ou PNG.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Maximo 2MB.')
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!avatarFile || !user) return avatarUrl

    const path = `avatars/${user.id}.jpg`
    const { error } = await supabase.storage
      .from('assets')
      .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })

    if (error) {
      toast.error('Erro ao enviar foto: ' + error.message)
      return avatarUrl
    }

    const { data: urlData } = supabase.storage.from('assets').getPublicUrl(path)
    return urlData.publicUrl + '?t=' + Date.now()
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast.error('Nome e obrigatorio.')
      return
    }
    if (!user || !profile) return

    setSaving(true)
    try {
      let newAvatarUrl = avatarUrl
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar()
      }

      const { error } = await supabase
        .from('users_profiles')
        .update({
          nome: form.nome.trim(),
          telefone: form.telefone.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          creci: form.creci.trim() || null,
          bio: form.bio.trim() || null,
          avatar_url: newAvatarUrl,
          slug: slugify(form.nome),
        })
        .eq('user_id', user.id)

      if (error) {
        toast.error('Erro ao salvar: ' + error.message)
        return
      }

      setAvatarUrl(newAvatarUrl)
      setAvatarFile(null)
      setAvatarPreview(null)
      toast.success('Perfil atualizado com sucesso!')
      await refreshProfile()
    } catch (err: any) {
      toast.error('Erro inesperado: ' + (err?.message || 'Tente novamente'))
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (passForm.newPass.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (passForm.newPass !== passForm.confirm) {
      toast.error('As senhas nao conferem.')
      return
    }

    setChangingPass(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passForm.newPass })
      if (error) {
        toast.error('Erro ao alterar senha: ' + error.message)
        return
      }
      toast.success('Senha alterada com sucesso!')
      setPassForm({ current: '', newPass: '', confirm: '' })
    } catch (err: any) {
      toast.error('Erro inesperado: ' + (err?.message || 'Tente novamente'))
    } finally {
      setChangingPass(false)
    }
  }

  const displayAvatar = avatarPreview || avatarUrl
  const { percent, missing } = calcCompletion(form, avatarPreview || avatarUrl)

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-moradda-gold-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-moradda-gold-400/20 text-moradda-gold-500">
            <User size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Atualize suas informacoes profissionais
            </p>
          </div>
        </div>
      </div>

      {/* Completion Indicator */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Perfil {percent}% completo
          </span>
          {percent === 100 ? (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <CheckCircle2 size={14} /> Completo
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
              <AlertCircle size={14} /> Incompleto
            </span>
          )}
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percent === 100 ? 'bg-emerald-500' : 'bg-moradda-gold-500'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        {percent < 100 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Complete seu perfil para aparecer na pagina da equipe:
            </p>
            <ul className="space-y-0.5">
              {missing.map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Avatar Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Foto de Perfil</h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt="Avatar"
                className="h-[120px] w-[120px] rounded-full border-4 border-moradda-gold-400/30 object-cover"
              />
            ) : (
              <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full border-4 border-moradda-gold-400/30 bg-moradda-gold-400 text-4xl font-bold text-moradda-blue-900">
                {form.nome?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-moradda-gold-500 text-white shadow-md transition hover:bg-moradda-gold-600 dark:border-gray-800"
            >
              <Camera size={16} />
            </button>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Alterar foto
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400">JPG ou PNG. Maximo 2MB.</p>
            {avatarPreview && (
              <p className="text-xs font-medium text-moradda-gold-600">Nova foto selecionada (salve para aplicar)</p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleAvatarSelect}
          />
        </div>
      </div>

      {/* Personal Information */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Informacoes Pessoais</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Nome */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-moradda-gold-500 focus:outline-none focus:ring-2 focus:ring-moradda-gold-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Seu nome completo"
            />
          </div>

          {/* Email (readonly) */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
            />
            <p className="mt-1 text-xs text-gray-400">O e-mail esta vinculado a sua conta e nao pode ser alterado.</p>
          </div>

          {/* Telefone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Telefone
            </label>
            <input
              type="tel"
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-moradda-gold-500 focus:outline-none focus:ring-2 focus:ring-moradda-gold-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="(24) 99999-0000"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              WhatsApp
            </label>
            <input
              type="tel"
              name="whatsapp"
              value={form.whatsapp}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-moradda-gold-500 focus:outline-none focus:ring-2 focus:ring-moradda-gold-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="5524999990000"
            />
            <p className="mt-1 flex items-start gap-1 text-xs text-gray-400">
              <Info size={12} className="mt-0.5 shrink-0" />
              Formato internacional, usado para contato dos leads. Ex: 5524999990000
            </p>
          </div>

          {/* CRECI */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              CRECI
            </label>
            <input
              type="text"
              name="creci"
              value={form.creci}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-moradda-gold-500 focus:outline-none focus:ring-2 focus:ring-moradda-gold-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="10404"
            />
            <p className="mt-1 flex items-start gap-1 text-xs text-gray-400">
              <Info size={12} className="mt-0.5 shrink-0" />
              O CRECI aparece no site e nos laudos de precificacao (PTAMs).
            </p>
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Informacoes Profissionais</h2>
        <div className="space-y-4">
          {/* Bio */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bio / Apresentacao
            </label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={4}
              maxLength={500}
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-moradda-gold-500 focus:outline-none focus:ring-2 focus:ring-moradda-gold-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Escreva uma breve apresentacao profissional..."
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="flex items-start gap-1 text-xs text-gray-400">
                <Info size={12} className="mt-0.5 shrink-0" />
                Essa apresentacao aparece na pagina da equipe e nos seus imoveis no site.
              </p>
              <span className={`text-xs ${form.bio.length >= 480 ? 'text-amber-500' : 'text-gray-400'}`}>
                {form.bio.length}/500
              </span>
            </div>
          </div>

          {/* Slug (readonly) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              URL do perfil
            </label>
            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-800">
              <span className="shrink-0 border-r border-gray-200 px-3 py-2.5 text-xs text-gray-400 dark:border-gray-600">
                moraddaimobiliaria.com.br/equipe/
              </span>
              <input
                type="text"
                value={slug}
                readOnly
                className="w-full cursor-not-allowed bg-transparent px-3 py-2.5 text-sm text-gray-500 outline-none dark:text-gray-400"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">Gerado automaticamente a partir do nome.</p>
          </div>
        </div>
      </div>

      {/* Security Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-2">
          <Lock size={18} className="text-gray-500 dark:text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Alterar Senha</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Current password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Senha atual
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={passForm.current}
                onChange={(e) => setPassForm((p) => ({ ...p, current: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 transition focus:border-moradda-gold-500 focus:outline-none focus:ring-2 focus:ring-moradda-gold-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nova senha
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={passForm.newPass}
                onChange={(e) => setPassForm((p) => ({ ...p, newPass: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 transition focus:border-moradda-gold-500 focus:outline-none focus:ring-2 focus:ring-moradda-gold-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passForm.newPass && passForm.newPass.length < 6 && (
              <p className="mt-1 text-xs text-red-500">Minimo 6 caracteres</p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirmar nova senha
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={passForm.confirm}
                onChange={(e) => setPassForm((p) => ({ ...p, confirm: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 transition focus:border-moradda-gold-500 focus:outline-none focus:ring-2 focus:ring-moradda-gold-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passForm.confirm && passForm.newPass !== passForm.confirm && (
              <p className="mt-1 text-xs text-red-500">As senhas nao conferem</p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleChangePassword}
            disabled={changingPass || !passForm.newPass || !passForm.confirm}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-600 dark:hover:bg-gray-500"
          >
            {changingPass ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            Alterar Senha
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-moradda-gold-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-moradda-gold-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Salvar Alteracoes
        </button>
      </div>
    </div>
  )
}
