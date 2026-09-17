import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronDown, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

// Foto do hero — mansão de alto padrão com piscina (asset local, otimizado).
const HERO_IMG = '/hero.jpg'

export default function HeroSection() {
  const navigate = useNavigate()
  const [tipo, setTipo] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [finalidade, setFinalidade] = useState('')
  const [bairros, setBairros] = useState<{ id: string; nome: string; cidade: string }[]>([])
  const [tipos, setTipos] = useState<{ value: string; label: string }[]>([])
  const [totalImoveis, setTotalImoveis] = useState<number | null>(null)

  useEffect(() => {
    async function fetchFiltros() {
      const { data, count } = await supabase
        .from('imoveis')
        .select('tipo, bairro_id, bairros(id, nome, cidade)', { count: 'exact' })
        .eq('status', 'publicado')

      setTotalImoveis(count ?? (data?.length ?? null))

      const bairroMap = new Map<string, { nome: string; cidade: string }>()
      const tipoSet = new Set<string>()
      data?.forEach((d: any) => {
        if (d.tipo) tipoSet.add(d.tipo)
        if (d.bairros && !bairroMap.has(d.bairros.id))
          bairroMap.set(d.bairros.id, { nome: d.bairros.nome, cidade: d.bairros.cidade || 'Resende' })
      })

      setBairros(Array.from(bairroMap, ([id, v]) => ({ id, ...v })).sort((a, b) => a.nome.localeCompare(b.nome)))
      const tipoLabels: Record<string, string> = { casa: 'Casa', apartamento: 'Apartamento', terreno: 'Terreno', comercial: 'Comercial', rural: 'Rural', cobertura: 'Cobertura', kitnet: 'Kitnet', sobrado: 'Sobrado' }
      setTipos(Array.from(tipoSet).map((t) => ({ value: t, label: tipoLabels[t] || t })).sort((a, b) => a.label.localeCompare(b.label)))
    }
    fetchFiltros()
  }, [])

  const cidades = Array.from(new Set(bairros.map((b) => b.cidade))).sort()
  const cidadeUnica = cidades.length <= 1

  function buscar() {
    const p = new URLSearchParams()
    if (finalidade) p.set('finalidade', finalidade)
    if (tipo) p.set('tipo', tipo)
    if (bairro) p.set('bairro', bairro)
    navigate(`/imoveis?${p.toString()}`)
  }

  const ancoras = [
    { valor: totalImoveis != null ? String(totalImoveis) : '—', label: 'Imóveis disponíveis' },
    { valor: 'Resende', label: '& Itatiaia · RJ' },
    { valor: 'CRECI-PJ', label: 'RJ 10404' },
    { valor: 'Grupo', label: 'Alfacon' },
  ]

  return (
    <section className="relative flex min-h-[92vh] flex-col justify-center overflow-hidden">
      {/* Fundo: foto real de imóvel premium da carteira */}
      <img
        src={HERO_IMG}
        alt="Imóvel de alto padrão em Resende"
        className="absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="high"
      />

      {/* Overlay editorial: escurece base e cantos, mantém o meio respirando */}
      <div className="absolute inset-0 bg-gradient-to-b from-moradda-blue-950/75 via-moradda-blue-950/45 to-moradda-blue-950/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(5,14,26,0.55)_100%)]" />

      {/* Conteúdo */}
      <div className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 pt-32 pb-16 flex flex-col justify-center">
        <motion.div
          className="max-w-3xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 text-moradda-gold-300 font-body text-[13px] font-medium tracking-[0.28em] uppercase mb-7">
            <span className="h-px w-8 bg-moradda-gold-400/70" />
            Imobiliária · Resende e Itatiaia
          </span>

          <h1 className="font-heading text-white leading-[1.05] text-5xl sm:text-6xl lg:text-[4.6rem] font-light">
            O endereço certo para
            <span className="block italic text-moradda-gold-300">a sua próxima história.</span>
          </h1>

          <p className="mt-7 max-w-xl text-white/75 text-lg font-body font-light leading-relaxed">
            Curadoria de casas, apartamentos e terrenos em Resende e Itatiaia — com
            assessoria completa, do primeiro contato às chaves.
          </p>
        </motion.div>

        {/* Busca — card branco flutuante */}
        <motion.div
          className="mt-12 w-full"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-2xl bg-white/95 backdrop-blur-xl p-3 shadow-2xl shadow-black/30 ring-1 ring-black/5">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
              <Campo label="Finalidade">
                <select value={finalidade} onChange={(e) => setFinalidade(e.target.value)} className="hero-select">
                  <option value="">Comprar ou alugar</option>
                  <option value="venda">Comprar</option>
                  <option value="aluguel">Alugar</option>
                </select>
              </Campo>
              <Campo label="Tipo">
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="hero-select">
                  <option value="">Todos os tipos</option>
                  {tipos.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Campo>
              <Campo label="Cidade">
                <select value={cidade} disabled={cidadeUnica} onChange={(e) => { setCidade(e.target.value); setBairro('') }} className="hero-select">
                  {cidadeUnica ? <option>{(cidades[0] || 'Resende')} · RJ</option> : (
                    <>
                      <option value="">Todas</option>
                      {cidades.map((c) => <option key={c} value={c}>{c} · RJ</option>)}
                    </>
                  )}
                </select>
              </Campo>
              <Campo label="Bairro">
                <select value={bairro} onChange={(e) => setBairro(e.target.value)} className="hero-select">
                  <option value="">Todos os bairros</option>
                  {bairros.filter((b) => !cidade || b.cidade === cidade).map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
                </select>
              </Campo>
              <button
                onClick={buscar}
                className="flex items-center justify-center gap-2 rounded-xl bg-moradda-blue-800 px-7 py-3.5 font-body text-sm font-semibold text-white transition-all duration-300 hover:bg-moradda-blue-900 md:px-6"
              >
                <Search className="h-4 w-4" />
                <span>Buscar</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Âncoras — faixa inferior discreta (dados reais, sem métricas infladas) */}
      <motion.div
        className="relative z-10 border-t border-white/10 bg-white/[0.04] backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-white/10 px-6 md:grid-cols-4">
          {ancoras.map((a) => (
            <div key={a.label} className="flex items-center gap-3 py-6">
              <MapPin className="hidden h-4 w-4 shrink-0 text-moradda-gold-400/60 sm:block" />
              <div>
                <div className="font-heading text-xl text-moradda-gold-300">{a.valor}</div>
                <div className="font-body text-xs text-white/60">{a.label}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="group relative flex flex-col rounded-xl px-4 py-2 transition-colors hover:bg-moradda-blue-50/60">
      <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-moradda-blue-500/70">{label}</span>
      <div className="relative">
        {children}
        <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-moradda-blue-400" />
      </div>
    </label>
  )
}
