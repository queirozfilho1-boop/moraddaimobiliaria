import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Calculator, DollarSign, Percent, Clock, TrendingUp } from 'lucide-react'
import SEO from '@/components/common/SEO'
import ScrollReveal from '@/components/common/ScrollReveal'
import { formatCurrency } from '@/lib/utils'

export default function FinanciamentoPage() {
  const [valorImovel, setValorImovel] = useState('')
  const [entrada, setEntrada] = useState('')
  const [taxaJuros, setTaxaJuros] = useState('9.5')
  const [prazoAnos, setPrazoAnos] = useState('30')
  const [resultado, setResultado] = useState<{
    parcela: number
    totalPago: number
    totalJuros: number
  } | null>(null)

  function parseCurrency(value: string): number {
    return Number(value.replace(/\D/g, '')) / 100
  }

  function formatInput(value: string): string {
    const num = Number(value.replace(/\D/g, ''))
    if (!num) return ''
    return (num / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  function calcular() {
    const pv = parseCurrency(valorImovel) - parseCurrency(entrada)
    const taxaMensal = Number(taxaJuros.replace(',', '.')) / 100 / 12
    const n = Number(prazoAnos) * 12

    if (pv <= 0 || taxaMensal <= 0 || n <= 0) return

    // PMT = PV * [i(1+i)^n] / [(1+i)^n - 1]
    const fator = Math.pow(1 + taxaMensal, n)
    const parcela = pv * (taxaMensal * fator) / (fator - 1)
    const totalPago = parcela * n
    const totalJuros = totalPago - pv

    setResultado({ parcela, totalPago, totalJuros })
  }

  function limpar() {
    setValorImovel('')
    setEntrada('')
    setTaxaJuros('9.5')
    setPrazoAnos('30')
    setResultado(null)
  }

  return (
    <>
      <SEO
        title="Simulador de Financiamento"
        description="Simule seu financiamento imobiliario com a Moradda. Calcule parcelas, juros e total a pagar."
      />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-moradda-blue-800 to-moradda-blue-900 pb-20 pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,169,74,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-8 flex items-center gap-2 font-body text-sm text-moradda-blue-300">
            <Link to="/" className="transition-colors hover:text-moradda-gold-400">
              Inicio
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-moradda-gold-400">Financiamento</span>
          </nav>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-heading text-4xl font-bold text-white sm:text-5xl lg:text-6xl"
          >
            Simulador de Financiamento
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-moradda-blue-200"
          >
            Descubra o valor das parcelas do seu financiamento imobiliario
          </motion.p>
        </div>
      </section>

      {/* Calculator */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Form */}
            <ScrollReveal>
              <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-moradda-gold-400/10">
                    <Calculator className="h-6 w-6 text-moradda-gold-400" />
                  </div>
                  <h2 className="font-heading text-xl font-bold text-moradda-blue-800">
                    Dados do Financiamento
                  </h2>
                </div>

                <div className="space-y-5">
                  {/* Valor do Imovel */}
                  <div>
                    <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">
                      Valor do Imovel
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={valorImovel}
                        onChange={(e) => setValorImovel(formatInput(e.target.value))}
                        placeholder="R$ 0,00"
                        className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 font-body text-sm text-gray-800 transition-colors focus:border-moradda-blue-500 focus:outline-none focus:ring-2 focus:ring-moradda-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Entrada */}
                  <div>
                    <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">
                      Valor da Entrada
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={entrada}
                        onChange={(e) => setEntrada(formatInput(e.target.value))}
                        placeholder="R$ 0,00"
                        className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 font-body text-sm text-gray-800 transition-colors focus:border-moradda-blue-500 focus:outline-none focus:ring-2 focus:ring-moradda-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Taxa de Juros */}
                  <div>
                    <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">
                      Taxa de Juros (% ao ano)
                    </label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={taxaJuros}
                        onChange={(e) => setTaxaJuros(e.target.value)}
                        placeholder="9.5"
                        className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 font-body text-sm text-gray-800 transition-colors focus:border-moradda-blue-500 focus:outline-none focus:ring-2 focus:ring-moradda-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Prazo */}
                  <div>
                    <label className="mb-1.5 block font-body text-sm font-medium text-gray-700">
                      Prazo (anos)
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        value={prazoAnos}
                        onChange={(e) => setPrazoAnos(e.target.value)}
                        min="1"
                        max="35"
                        placeholder="30"
                        className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 font-body text-sm text-gray-800 transition-colors focus:border-moradda-blue-500 focus:outline-none focus:ring-2 focus:ring-moradda-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={calcular}
                      className="flex-1 rounded-xl bg-moradda-blue-500 px-6 py-3.5 font-body text-sm font-semibold text-white shadow-md transition-all hover:bg-moradda-blue-600 hover:shadow-lg"
                    >
                      Calcular
                    </button>
                    <button
                      onClick={limpar}
                      className="rounded-xl border-2 border-gray-200 px-6 py-3.5 font-body text-sm font-semibold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Results */}
            <ScrollReveal delay={150}>
              <div className="space-y-6">
                {resultado ? (
                  <>
                    {/* Parcela Mensal */}
                    <div className="rounded-2xl border border-moradda-gold-400/30 bg-gradient-to-br from-moradda-blue-800 to-moradda-blue-900 p-8 shadow-lg">
                      <p className="font-body text-sm text-moradda-blue-300">Parcela Mensal</p>
                      <p className="mt-2 font-heading text-4xl font-bold text-white">
                        {formatCurrency(resultado.parcela)}
                      </p>
                      <p className="mt-1 font-body text-sm text-moradda-blue-400">
                        pelo sistema Price (parcelas fixas)
                      </p>
                    </div>

                    {/* Total Pago */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-moradda-blue-50">
                          <TrendingUp className="h-5 w-5 text-moradda-blue-500" />
                        </div>
                        <div>
                          <p className="font-body text-sm text-gray-500">Total Pago</p>
                          <p className="font-heading text-xl font-bold text-moradda-blue-800">
                            {formatCurrency(resultado.totalPago)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Total de Juros */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                          <Percent className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-body text-sm text-gray-500">Total de Juros</p>
                          <p className="font-heading text-xl font-bold text-red-600">
                            {formatCurrency(resultado.totalJuros)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                      <h3 className="font-heading text-lg font-semibold text-moradda-blue-800">Resumo</h3>
                      <dl className="mt-4 space-y-3">
                        <div className="flex justify-between">
                          <dt className="font-body text-sm text-gray-500">Valor financiado</dt>
                          <dd className="font-body text-sm font-medium text-moradda-blue-800">
                            {formatCurrency(parseCurrency(valorImovel) - parseCurrency(entrada))}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-body text-sm text-gray-500">Entrada</dt>
                          <dd className="font-body text-sm font-medium text-moradda-blue-800">
                            {formatCurrency(parseCurrency(entrada))}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-body text-sm text-gray-500">Taxa de juros</dt>
                          <dd className="font-body text-sm font-medium text-moradda-blue-800">{taxaJuros}% a.a.</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-body text-sm text-gray-500">Prazo</dt>
                          <dd className="font-body text-sm font-medium text-moradda-blue-800">
                            {prazoAnos} anos ({Number(prazoAnos) * 12} parcelas)
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
                    <div className="rounded-full bg-moradda-blue-50 p-6">
                      <Calculator className="h-10 w-10 text-moradda-blue-300" />
                    </div>
                    <h3 className="mt-6 font-heading text-xl font-semibold text-moradda-blue-800">
                      Resultado da Simulacao
                    </h3>
                    <p className="mt-2 max-w-sm font-body text-sm text-gray-500">
                      Preencha os dados ao lado e clique em "Calcular" para ver o resultado do seu financiamento.
                    </p>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>

          {/* Disclaimer */}
          <ScrollReveal>
            <p className="mt-10 text-center font-body text-xs text-gray-400">
              * Esta simulacao tem carater informativo e nao constitui oferta de credito.
              Os valores reais podem variar conforme a instituicao financeira, perfil do cliente e analise de credito.
            </p>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
