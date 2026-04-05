import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home, Calculator, Check, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import SEO from '@/components/common/SEO'
import ScrollReveal from '@/components/common/ScrollReveal'
import { TIPOS_IMOVEL } from '@/lib/constants'
import { supabase } from '@/lib/supabase'

interface AvaliacaoForm {
  nome: string
  telefone: string
  email: string
  tipo: string
  bairro: string
  area: string
  quartos: string
  vagas: string
  descricao: string
}

export default function AvaliacaoPage() {
  const [form, setForm] = useState<AvaliacaoForm>({
    nome: '', telefone: '', email: '', tipo: '', bairro: '', area: '', quartos: '', vagas: '', descricao: ''
  })
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AvaliacaoForm, string>>>({})

  const update = (field: keyof AvaliacaoForm, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof AvaliacaoForm, string>> = {}
    if (!form.nome) errors.nome = 'Nome é obrigatório'
    if (!form.telefone) {
      errors.telefone = 'Telefone é obrigatório'
    } else if (form.telefone.replace(/\D/g, '').length < 10) {
      errors.telefone = 'Telefone deve ter no mínimo 10 dígitos'
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'E-mail inválido'
    }
    if (!form.tipo) errors.tipo = 'Tipo do imóvel é obrigatório'
    if (!form.bairro) errors.bairro = 'Bairro é obrigatório'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Corrija os erros no formulário')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.from('leads').insert({
        nome: form.nome,
        email: form.email || null,
        telefone: form.telefone,
        mensagem: `Tipo: ${form.tipo}, Bairro: ${form.bairro}, Área: ${form.area}m², Quartos: ${form.quartos}, Vagas: ${form.vagas}. ${form.descricao}`,
        origem: 'avaliacao',
        status: 'novo',
      })
      if (error) throw error
      toast.success('Solicitação enviada! Nossa equipe entrará em contato para a avaliação.')
      setForm({ nome: '', telefone: '', email: '', tipo: '', bairro: '', area: '', quartos: '', vagas: '', descricao: '' })
    } catch (err) {
      console.error('Erro ao enviar avaliação:', err)
      toast.error('Erro ao enviar solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO
        title="Avalie seu Imóvel Gratuitamente"
        description="Solicite uma avaliação gratuita do seu imóvel com a Moradda Imobiliária. Descubra quanto vale o seu patrimônio com quem entende do mercado."
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-moradda-blue-800 to-moradda-blue-900 pb-12 pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-6 flex items-center gap-2 font-body text-sm text-moradda-blue-300">
            <Link to="/" className="transition-colors hover:text-moradda-gold-400"><Home className="h-4 w-4" /></Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">Avaliação de Imóvel</span>
          </nav>
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Avalie seu Imóvel <span className="text-moradda-gold-400">Gratuitamente</span>
          </h1>
          <p className="mt-3 max-w-2xl font-body text-lg text-moradda-blue-200">
            Descubra quanto vale o seu patrimônio. Nossa equipe fará uma análise completa e personalizada.
          </p>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
            {/* Benefits */}
            <div className="lg:col-span-2 space-y-6">
              <ScrollReveal>
                <h2 className="font-heading text-2xl font-bold text-moradda-blue-800 line-gold">
                  Por que avaliar com a Moradda?
                </h2>
                <div className="mt-8 space-y-5">
                  {[
                    { title: 'Análise de mercado real', desc: 'Utilizamos dados atualizados da região para uma estimativa precisa' },
                    { title: 'Equipe especializada', desc: 'Corretores com experiência no mercado de Resende e região' },
                    { title: 'Sem compromisso', desc: 'A avaliação é gratuita e não gera nenhuma obrigação' },
                    { title: 'Resposta rápida', desc: 'Retornamos em até 24 horas com uma estimativa inicial' },
                    { title: 'Suporte completo', desc: 'Parte do Grupo Alfacon — apoio contábil e documental incluído' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-moradda-gold-400">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <p className="font-body text-sm font-semibold text-moradda-blue-800">{item.title}</p>
                        <p className="font-body text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <div className="rounded-2xl bg-moradda-blue-900 p-6">
                  <Calculator className="h-8 w-8 text-moradda-gold-400" />
                  <h3 className="mt-3 font-heading text-lg font-semibold text-white">
                    Como funciona?
                  </h3>
                  <ol className="mt-4 space-y-3">
                    {[
                      'Preencha o formulário com os dados do imóvel',
                      'Nossa equipe analisa as informações e o mercado local',
                      'Você recebe uma estimativa de valor por WhatsApp',
                      'Se quiser, agendamos uma visita para avaliação presencial',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-moradda-gold-400/20 font-body text-xs font-bold text-moradda-gold-400">
                          {i + 1}
                        </span>
                        <span className="font-body text-sm text-moradda-blue-200">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </ScrollReveal>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <ScrollReveal delay={100}>
                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                  <h2 className="font-heading text-2xl font-semibold text-moradda-blue-800">
                    Dados do Imóvel
                  </h2>
                  <p className="mt-2 mb-6 font-body text-sm text-gray-500">
                    Preencha as informações abaixo para recebermos uma estimativa.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">Seu Nome *</label>
                        <input type="text" value={form.nome} onChange={e => update('nome', e.target.value)} required placeholder="Nome completo"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100" />
                        {fieldErrors.nome && <p className="mt-1 font-body text-xs text-red-500">{fieldErrors.nome}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">Telefone/WhatsApp *</label>
                        <input type="tel" value={form.telefone} onChange={e => update('telefone', e.target.value)} required placeholder="(24) 00000-0000"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100" />
                        {fieldErrors.telefone && <p className="mt-1 font-body text-xs text-red-500">{fieldErrors.telefone}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">E-mail</label>
                      <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="seu@email.com"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100" />
                      {fieldErrors.email && <p className="mt-1 font-body text-xs text-red-500">{fieldErrors.email}</p>}
                    </div>

                    <div className="h-px bg-gray-100" />

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">Tipo do Imóvel *</label>
                        <select value={form.tipo} onChange={e => update('tipo', e.target.value)} required
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm text-gray-700 outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100">
                          <option value="">Selecione</option>
                          {TIPOS_IMOVEL.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        {fieldErrors.tipo && <p className="mt-1 font-body text-xs text-red-500">{fieldErrors.tipo}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">Bairro *</label>
                        <input type="text" value={form.bairro} onChange={e => update('bairro', e.target.value)} required placeholder="Nome do bairro"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100" />
                        {fieldErrors.bairro && <p className="mt-1 font-body text-xs text-red-500">{fieldErrors.bairro}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">Área aprox. (m²)</label>
                        <input type="number" value={form.area} onChange={e => update('area', e.target.value)} placeholder="Ex: 120"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100" />
                      </div>
                      <div>
                        <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">Quartos</label>
                        <input type="number" value={form.quartos} onChange={e => update('quartos', e.target.value)} placeholder="Ex: 3"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100" />
                      </div>
                      <div>
                        <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">Vagas</label>
                        <input type="number" value={form.vagas} onChange={e => update('vagas', e.target.value)} placeholder="Ex: 2"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">Observações</label>
                      <textarea value={form.descricao} onChange={e => update('descricao', e.target.value)} rows={3} placeholder="Descreva detalhes adicionais do imóvel (reformas, diferenciais, etc.)"
                        className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100" />
                    </div>

                    <button type="submit" disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-moradda-gold-400 px-8 py-4 font-body text-base font-semibold text-white shadow-lg transition-all hover:bg-moradda-gold-500 hover:shadow-xl disabled:opacity-50">
                      {loading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <ArrowRight className="h-5 w-5" />
                      )}
                      {loading ? 'Enviando...' : 'Solicitar Avaliação Gratuita'}
                    </button>
                  </form>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
