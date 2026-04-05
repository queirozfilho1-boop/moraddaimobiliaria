import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home, Phone, Mail, MapPin, MessageCircle, Clock, Send } from 'lucide-react'
import { toast } from 'sonner'
import SEO from '@/components/common/SEO'
import ScrollReveal from '@/components/common/ScrollReveal'
import { WHATSAPP_NUMBER } from '@/lib/constants'
import { supabase } from '@/lib/supabase'

interface FormData {
  nome: string
  email: string
  telefone: string
  assunto: string
  mensagem: string
}

export default function ContatoPage() {
  const [form, setForm] = useState<FormData>({
    nome: '', email: '', telefone: '', assunto: '', mensagem: ''
  })
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {}
    if (!form.nome) errors.nome = 'Nome é obrigatório'
    if (!form.telefone) {
      errors.telefone = 'Telefone é obrigatório'
    } else if (form.telefone.replace(/\D/g, '').length < 10) {
      errors.telefone = 'Telefone deve ter no mínimo 10 dígitos'
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'E-mail inválido'
    }
    if (!form.mensagem) errors.mensagem = 'Mensagem é obrigatória'
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
        mensagem: form.assunto ? `[${form.assunto}] ${form.mensagem}` : form.mensagem || null,
        origem: 'site_contato',
        status: 'novo',
      })
      if (error) throw error
      toast.success('Mensagem enviada com sucesso! Entraremos em contato em breve.')
      setForm({ nome: '', email: '', telefone: '', assunto: '', mensagem: '' })
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
      toast.error('Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const update = (field: keyof FormData, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  return (
    <>
      <SEO
        title="Contato"
        description="Entre em contato com a Moradda Imobiliária. Estamos prontos para ajudar você a encontrar o imóvel ideal em Resende e região."
      />

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-moradda-blue-800 to-moradda-blue-900 pb-12 pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-6 flex items-center gap-2 font-body text-sm text-moradda-blue-300">
            <Link to="/" className="transition-colors hover:text-moradda-gold-400"><Home className="h-4 w-4" /></Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">Contato</span>
          </nav>
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Fale Conosco
          </h1>
          <p className="mt-3 max-w-2xl font-body text-lg text-moradda-blue-200">
            Estamos prontos para ajudar você. Entre em contato por qualquer canal
          </p>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Contact Info */}
            <div className="space-y-6">
              <ScrollReveal>
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="font-heading text-xl font-semibold text-moradda-blue-800 line-gold">
                    Informações de Contato
                  </h2>
                  <div className="mt-6 space-y-5">
                    <a href="tel:+5524998571528" className="flex items-start gap-4 group">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-moradda-blue-50 text-moradda-blue-500 transition-colors group-hover:bg-moradda-gold-400 group-hover:text-white">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-body text-sm font-semibold text-moradda-blue-800">Telefone</p>
                        <p className="font-body text-sm text-gray-500">(24) 99857-1528</p>
                      </div>
                    </a>

                    <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-500 transition-colors group-hover:bg-green-500 group-hover:text-white">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-body text-sm font-semibold text-moradda-blue-800">WhatsApp</p>
                        <p className="font-body text-sm text-gray-500">(24) 99857-1528</p>
                      </div>
                    </a>

                    <a href="mailto:contato@moraddaimobiliaria.com.br" className="flex items-start gap-4 group">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-moradda-blue-50 text-moradda-blue-500 transition-colors group-hover:bg-moradda-gold-400 group-hover:text-white">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-body text-sm font-semibold text-moradda-blue-800">E-mail</p>
                        <p className="font-body text-sm text-gray-500 break-all">contato@moraddaimobiliaria.com.br</p>
                      </div>
                    </a>

                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-moradda-blue-50 text-moradda-blue-500">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-body text-sm font-semibold text-moradda-blue-800">Endereço</p>
                        <p className="font-body text-sm text-gray-500">
                          Rua Dom Bosco, nº 165 — Paraíso
                          <br />
                          Resende — RJ, 27541-140
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-moradda-blue-50 text-moradda-blue-500">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-body text-sm font-semibold text-moradda-blue-800">Horário</p>
                        <p className="font-body text-sm text-gray-500">Seg a Sex: 08h — 18h</p>
                        <p className="font-body text-sm text-gray-500">Sáb: 08h — 12h</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Map placeholder */}
              <ScrollReveal delay={100}>
                <div className="aspect-square overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-moradda-blue-50 to-moradda-blue-100 shadow-sm">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <MapPin className="mx-auto h-10 w-10 text-moradda-blue-300" />
                      <p className="mt-2 font-body text-sm text-moradda-blue-400">Mapa será integrado aqui</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <ScrollReveal delay={100}>
                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                  <h2 className="font-heading text-2xl font-semibold text-moradda-blue-800 line-gold">
                    Envie sua Mensagem
                  </h2>
                  <p className="mt-4 mb-8 font-body text-gray-500">
                    Preencha o formulário abaixo e nossa equipe entrará em contato o mais rápido possível.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">Nome *</label>
                        <input
                          type="text"
                          value={form.nome}
                          onChange={e => update('nome', e.target.value)}
                          placeholder="Seu nome completo"
                          required
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100"
                        />
                        {fieldErrors.nome && <p className="mt-1 font-body text-xs text-red-500">{fieldErrors.nome}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">Telefone *</label>
                        <input
                          type="tel"
                          value={form.telefone}
                          onChange={e => update('telefone', e.target.value)}
                          placeholder="(24) 99857-1528"
                          required
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100"
                        />
                        {fieldErrors.telefone && <p className="mt-1 font-body text-xs text-red-500">{fieldErrors.telefone}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">E-mail</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={e => update('email', e.target.value)}
                          placeholder="seu@email.com"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100"
                        />
                        {fieldErrors.email && <p className="mt-1 font-body text-xs text-red-500">{fieldErrors.email}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">Assunto</label>
                        <select
                          value={form.assunto}
                          onChange={e => update('assunto', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm text-gray-700 outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100"
                        >
                          <option value="">Selecione</option>
                          <option value="comprar">Quero comprar um imóvel</option>
                          <option value="vender">Quero vender um imóvel</option>
                          <option value="alugar">Quero alugar um imóvel</option>
                          <option value="avaliar">Quero avaliar um imóvel</option>
                          <option value="parceria">Proposta de parceria</option>
                          <option value="outro">Outro assunto</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">Mensagem *</label>
                      <textarea
                        value={form.mensagem}
                        onChange={e => update('mensagem', e.target.value)}
                        placeholder="Como podemos ajudar?"
                        rows={5}
                        required
                        className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-body text-sm outline-none transition-all focus:border-moradda-blue-300 focus:bg-white focus:ring-2 focus:ring-moradda-blue-100"
                      />
                      {fieldErrors.mensagem && <p className="mt-1 font-body text-xs text-red-500">{fieldErrors.mensagem}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 rounded-xl bg-moradda-blue-500 px-8 py-3.5 font-body text-sm font-semibold text-white shadow-md transition-all hover:bg-moradda-blue-600 hover:shadow-lg disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                      {loading ? 'Enviando...' : 'Enviar Mensagem'}
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
