import { useEffect, useState } from 'react'
import { Loader2, LogOut, Building2, FileSignature, Wallet, FileText, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'

interface Proprietario {
  id: string; nome: string; cpf_cnpj?: string | null; email?: string | null
}

interface Repasse {
  id: string; valor_bruto: number; taxa_admin: number; valor_repasse: number
  status: string; data_referencia: string; data_repasse?: string | null
  contratos_locacao?: { numero?: string; imoveis?: { codigo?: string; titulo?: string } | null } | null
}

interface ContratoVinc {
  id: string; numero: string; status: string; valor_aluguel: number
  data_inicio: string; data_fim: string
  imoveis?: { codigo?: string; titulo?: string } | null
}

interface ImovelVinc {
  imovel_id: string; participacao_pct: number
  imoveis?: { codigo?: string; titulo?: string; status?: string } | null
}

const fmt = (v?: number | null) => v == null ? 'R$ 0,00' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtData = (s?: string | null) => s ? s.split('T')[0].split('-').reverse().join('/') : '—'

const Portal = () => {
  const [phase, setPhase] = useState<'check' | 'login' | 'sent' | 'app'>('check')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')

  const [prop, setProp] = useState<Proprietario | null>(null)
  const [imoveis, setImoveis] = useState<ImovelVinc[]>([])
  const [contratos, setContratos] = useState<ContratoVinc[]>([])
  const [repasses, setRepasses] = useState<Repasse[]>([])
  const [loading, setLoading] = useState(true)

  // Verificar sessão atual
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        setPhase('app')
        await loadData(data.session.user.email!)
      } else {
        setPhase('login')
      }
    })
  }, [])

  async function loadData(userEmail: string) {
    setLoading(true)
    const { data: p } = await supabase.from('proprietarios').select('id, nome, cpf_cnpj, email').eq('email', userEmail).maybeSingle()
    if (!p) { setLoading(false); return }
    setProp(p as Proprietario)

    const [{ data: imv }, { data: cnt }, { data: rep }] = await Promise.all([
      supabase.from('imoveis_proprietarios').select('imovel_id, participacao_pct, imoveis(codigo, titulo, status)').eq('proprietario_id', p.id),
      supabase.from('contratos_locacao')
        .select('id, numero, status, valor_aluguel, data_inicio, data_fim, imoveis(codigo, titulo)')
        .in('imovel_id', [
          ...((await supabase.from('imoveis_proprietarios').select('imovel_id').eq('proprietario_id', p.id)).data || []).map((x: any) => x.imovel_id),
        ]).order('created_at', { ascending: false }),
      supabase.from('contratos_repasses').select(
        `id, valor_bruto, taxa_admin, valor_repasse, status, data_referencia, data_repasse,
         contratos_locacao(numero, imoveis(codigo, titulo))`
      ).eq('proprietario_id', p.id).order('data_referencia', { ascending: false }).limit(24),
    ])
    setImoveis((imv || []) as any)
    setContratos((cnt || []) as any)
    setRepasses((rep || []) as any)
    setLoading(false)
  }

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setSending(true); setErr('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/portal` },
    })
    setSending(false)
    if (error) setErr(error.message)
    else setPhase('sent')
  }

  async function logout() {
    await supabase.auth.signOut()
    setPhase('login'); setProp(null); setEmail('')
  }

  // Loading
  if (phase === 'check') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
  }

  // Login
  if (phase === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-amber-700 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
          <div className="text-center mb-6">
            <Mail className="mx-auto text-blue-600 mb-2" size={36} />
            <h1 className="text-2xl font-bold text-gray-800">Portal do Proprietário</h1>
            <p className="text-sm text-gray-500 mt-1">Receba um link no e-mail pra acessar seus imóveis e repasses</p>
          </div>
          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-gray-600 block mb-1">E-mail cadastrado</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="seu@email.com" />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button type="submit" disabled={sending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {sending ? <Loader2 className="animate-spin" size={15} /> : <Mail size={15} />}
              Receber link de acesso
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-gray-500">
            Ainda não tem cadastro? <Link to="/contato" className="text-blue-600 hover:underline">Fale com a Moradda</Link>
          </p>
        </div>
      </div>
    )
  }

  // Magic link enviado
  if (phase === 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-amber-700 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <CheckCircle2 className="mx-auto text-green-500 mb-3" size={48} />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Verifique seu e-mail</h1>
          <p className="text-sm text-gray-600">
            Enviamos um link de acesso para <strong>{email}</strong>. <br />
            Clique no link pra entrar — o link expira em 1 hora.
          </p>
          <button onClick={() => setPhase('login')} className="mt-6 text-xs text-blue-600 hover:underline">
            Voltar
          </button>
        </div>
      </div>
    )
  }

  // App
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
  }

  if (!prop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <AlertCircle className="mx-auto text-amber-500 mb-3" size={36} />
          <h2 className="text-lg font-bold text-gray-800 mb-2">E-mail não cadastrado</h2>
          <p className="text-sm text-gray-600 mb-4">Não encontramos um proprietário cadastrado com seu e-mail.</p>
          <button onClick={logout} className="text-sm text-blue-600 hover:underline">Sair</button>
        </div>
      </div>
    )
  }

  const totalReceitaMes = repasses.filter((r) => {
    const d = new Date(r.data_referencia)
    const hoje = new Date()
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear() && r.status === 'concluido'
  }).reduce((s, r) => s + Number(r.valor_repasse), 0)

  const totalAcumulado = repasses.filter((r) => r.status === 'concluido').reduce((s, r) => s + Number(r.valor_repasse), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Portal do Proprietário</h1>
            <p className="text-xs text-blue-200">Olá, {prop.nome.split(' ')[0]}</p>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-1 text-sm text-blue-200 hover:text-white">
            <LogOut size={15} /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Resumo financeiro */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat icon={<Wallet />} label="Receita do mês" value={fmt(totalReceitaMes)} cor="green" />
          <Stat icon={<Wallet />} label="Acumulado (últimos 24m)" value={fmt(totalAcumulado)} cor="blue" />
          <Stat icon={<Building2 />} label="Imóveis cadastrados" value={String(imoveis.length)} cor="purple" />
        </div>

        {/* Imóveis */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><Building2 size={16} /> Meus Imóveis</h2>
          {imoveis.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum imóvel vinculado.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {imoveis.map((i) => (
                <li key={i.imovel_id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{i.imoveis?.codigo} - {i.imoveis?.titulo}</p>
                    <p className="text-xs text-gray-500">Participação: {i.participacao_pct}% · Status: {i.imoveis?.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Contratos */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><FileSignature size={16} /> Contratos Ativos</h2>
          {contratos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum contrato vinculado.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {contratos.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs text-blue-600">{c.numero}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{c.status}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 mt-1">{c.imoveis?.codigo} - {c.imoveis?.titulo}</p>
                  <p className="text-xs text-gray-500">{fmtData(c.data_inicio)} → {fmtData(c.data_fim)} · {fmt(c.valor_aluguel)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Repasses */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><Wallet size={16} /> Histórico de Repasses</h2>
          {repasses.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum repasse ainda.</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-gray-500 border-b">
                  <tr>
                    <th className="text-left px-2 py-2">Mês ref.</th>
                    <th className="text-left px-2 py-2">Imóvel</th>
                    <th className="text-right px-2 py-2">Bruto</th>
                    <th className="text-right px-2 py-2">Taxa</th>
                    <th className="text-right px-2 py-2">Líquido</th>
                    <th className="text-left px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {repasses.map((r) => (
                    <tr key={r.id}>
                      <td className="px-2 py-2 text-gray-700">{fmtData(r.data_referencia)}</td>
                      <td className="px-2 py-2 text-gray-700">{r.contratos_locacao?.imoveis?.codigo || '—'}</td>
                      <td className="px-2 py-2 text-right text-gray-700">{fmt(r.valor_bruto)}</td>
                      <td className="px-2 py-2 text-right text-amber-700">- {fmt(r.taxa_admin)}</td>
                      <td className="px-2 py-2 text-right font-semibold text-green-700">{fmt(r.valor_repasse)}</td>
                      <td className="px-2 py-2">
                        {r.status === 'concluido' ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Pago</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{r.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* CTAs */}
        <section className="bg-blue-50 rounded-xl border border-blue-200 p-5 text-center">
          <FileText className="mx-auto text-blue-600 mb-2" size={28} />
          <h3 className="font-semibold text-blue-900">Precisa do Informe IR?</h3>
          <p className="text-sm text-blue-700 mt-1 mb-3">Entre em contato com a Moradda — geramos o PDF anual.</p>
          <a href="https://wa.me/5524000000000" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Falar pelo WhatsApp <ArrowRight size={14} />
          </a>
        </section>
      </main>
    </div>
  )
}

const Stat = ({ icon, label, value, cor }: { icon: React.ReactNode; label: string; value: string; cor: string }) => {
  const cores: Record<string, string> = {
    green: 'border-green-200 bg-green-50 text-green-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    purple: 'border-purple-200 bg-purple-50 text-purple-800',
  }
  return (
    <div className={`rounded-xl border p-4 ${cores[cor]}`}>
      <div className="flex items-center gap-3">
        <div className="opacity-60">{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-wider opacity-70">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default Portal
