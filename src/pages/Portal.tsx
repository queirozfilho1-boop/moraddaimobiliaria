import { useEffect, useState } from 'react'
import {
  Loader2, LogOut, Building2, FileSignature, Wallet, FileText, Mail, ArrowRight,
  CheckCircle2, AlertCircle, Wrench, Plus, ExternalLink, Clock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'

const fmt = (v?: number | null) => v == null ? 'R$ 0,00' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtData = (s?: string | null) => s ? s.split('T')[0].split('-').reverse().join('/') : '—'

interface Proprietario { id: string; nome: string; cpf_cnpj?: string | null; email?: string | null }
interface ParteLocatario { id: string; nome: string; email: string; contrato_id: string }

const Portal = () => {
  const [phase, setPhase] = useState<'check' | 'login' | 'sent' | 'app'>('check')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const [tipo, setTipo] = useState<'proprietario' | 'locatario' | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        setPhase('app')
        await detectAndLoad(data.session.user.email!)
      } else {
        setPhase('login')
      }
    })
  }, [])

  async function detectAndLoad(userEmail: string) {
    // Tenta como proprietário primeiro
    const { data: prop } = await supabase.from('proprietarios').select('id, nome, cpf_cnpj, email').eq('email', userEmail).maybeSingle()
    if (prop) { setTipo('proprietario'); return }
    // Tenta como locatário
    const { data: loc } = await supabase.from('contratos_partes').select('id').eq('email', userEmail).eq('papel', 'locatario').limit(1).maybeSingle()
    if (loc) { setTipo('locatario'); return }
    setTipo(null)
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
    setPhase('login'); setTipo(null); setEmail('')
  }

  if (phase === 'check') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
  }

  if (phase === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-amber-700 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
          <div className="text-center mb-6">
            <Mail className="mx-auto text-blue-600 mb-2" size={36} />
            <h1 className="text-2xl font-bold text-gray-800">Portal Moradda</h1>
            <p className="text-sm text-gray-500 mt-1">Acesso pra proprietários e locatários · receba o link no e-mail</p>
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
            Sem cadastro? <Link to="/contato" className="text-blue-600 hover:underline">Fale com a Moradda</Link>
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-amber-700 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <CheckCircle2 className="mx-auto text-green-500 mb-3" size={48} />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Verifique seu e-mail</h1>
          <p className="text-sm text-gray-600">
            Enviamos um link de acesso para <strong>{email}</strong>. <br /> Expira em 1 hora.
          </p>
          <button onClick={() => setPhase('login')} className="mt-6 text-xs text-blue-600 hover:underline">Voltar</button>
        </div>
      </div>
    )
  }

  if (tipo === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <AlertCircle className="mx-auto text-amber-500 mb-3" size={36} />
          <h2 className="text-lg font-bold text-gray-800 mb-2">E-mail não cadastrado</h2>
          <p className="text-sm text-gray-600 mb-4">Não encontramos seu e-mail como proprietário nem locatário.</p>
          <button onClick={logout} className="text-sm text-blue-600 hover:underline">Sair</button>
        </div>
      </div>
    )
  }

  if (tipo === 'proprietario') return <DashboardProprietario onLogout={logout} />
  if (tipo === 'locatario')    return <DashboardLocatario    onLogout={logout} />
  return null
}

// ─────────────────────────────────────────────────────────────────
// DashboardProprietario
// ─────────────────────────────────────────────────────────────────
const DashboardProprietario = ({ onLogout }: { onLogout: () => void }) => {
  const [prop, setProp] = useState<Proprietario | null>(null)
  const [imoveis, setImoveis] = useState<any[]>([])
  const [contratos, setContratos] = useState<any[]>([])
  const [repasses, setRepasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) return
      const { data: p } = await supabase.from('proprietarios').select('*').eq('email', user.email).single()
      setProp(p)
      if (!p) { setLoading(false); return }

      const imovelIds = ((await supabase.from('imoveis_proprietarios').select('imovel_id').eq('proprietario_id', p.id)).data || []).map((x: any) => x.imovel_id)
      const [{ data: imv }, { data: cnt }, { data: rep }] = await Promise.all([
        supabase.from('imoveis_proprietarios').select('imovel_id, participacao_pct, imoveis(codigo, titulo, status)').eq('proprietario_id', p.id),
        imovelIds.length > 0 ? supabase.from('contratos_locacao').select('id, numero, status, valor_aluguel, data_inicio, data_fim, imoveis(codigo, titulo)').in('imovel_id', imovelIds).order('created_at', { ascending: false }) : { data: [] },
        supabase.from('contratos_repasses').select('id, valor_bruto, taxa_admin, valor_repasse, status, data_referencia, contratos_locacao(numero, imoveis(codigo, titulo))').eq('proprietario_id', p.id).order('data_referencia', { ascending: false }).limit(24),
      ])
      setImoveis((imv || []) as any[]); setContratos((cnt || []) as any[]); setRepasses((rep || []) as any[])
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-500" size={32} /></div>

  const receitaMes = repasses.filter((r) => {
    const d = new Date(r.data_referencia); const h = new Date()
    return d.getMonth() === h.getMonth() && d.getFullYear() === h.getFullYear() && r.status === 'concluido'
  }).reduce((s, r) => s + Number(r.valor_repasse), 0)
  const acumulado = repasses.filter((r) => r.status === 'concluido').reduce((s, r) => s + Number(r.valor_repasse), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header role="Proprietário" name={prop?.nome.split(' ')[0] || ''} onLogout={onLogout} />
      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat icon={<Wallet />} label="Receita do mês" value={fmt(receitaMes)} cor="green" />
          <Stat icon={<Wallet />} label="Acumulado (24m)" value={fmt(acumulado)} cor="blue" />
          <Stat icon={<Building2 />} label="Imóveis" value={String(imoveis.length)} cor="purple" />
        </div>

        <Card title="Meus Imóveis" icon={<Building2 size={16} />}>
          {imoveis.length === 0 ? <Empty>Nenhum imóvel</Empty> : (
            <ul className="divide-y divide-gray-100">
              {imoveis.map((i) => (
                <li key={i.imovel_id} className="py-3">
                  <p className="font-medium">{i.imoveis?.codigo} - {i.imoveis?.titulo}</p>
                  <p className="text-xs text-gray-500">Participação: {i.participacao_pct}% · Status: {i.imoveis?.status}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Contratos" icon={<FileSignature size={16} />}>
          {contratos.length === 0 ? <Empty>Sem contratos</Empty> : (
            <ul className="divide-y divide-gray-100">
              {contratos.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex justify-between"><span className="font-mono text-xs text-blue-600">{c.numero}</span><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{c.status}</span></div>
                  <p className="text-sm font-medium">{c.imoveis?.codigo}</p>
                  <p className="text-xs text-gray-500">{fmtData(c.data_inicio)} → {fmtData(c.data_fim)} · {fmt(c.valor_aluguel)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Repasses" icon={<Wallet size={16} />}>
          {repasses.length === 0 ? <Empty>Nenhum repasse</Empty> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="text-xs uppercase text-gray-500 border-b">
                <tr><th className="text-left p-2">Mês</th><th className="text-left p-2">Imóvel</th><th className="text-right p-2">Bruto</th><th className="text-right p-2">Taxa</th><th className="text-right p-2">Líquido</th><th className="p-2">Status</th></tr>
              </thead>
              <tbody className="divide-y">
                {repasses.map((r) => (
                  <tr key={r.id}>
                    <td className="p-2">{fmtData(r.data_referencia)}</td>
                    <td className="p-2">{r.contratos_locacao?.imoveis?.codigo || '—'}</td>
                    <td className="p-2 text-right">{fmt(r.valor_bruto)}</td>
                    <td className="p-2 text-right text-amber-700">- {fmt(r.taxa_admin)}</td>
                    <td className="p-2 text-right font-semibold text-green-700">{fmt(r.valor_repasse)}</td>
                    <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'concluido' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.status === 'concluido' ? 'Pago' : r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </Card>

        <CtaBox title="Precisa do Informe IR?" tel="5524000000000" />
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// DashboardLocatario
// ─────────────────────────────────────────────────────────────────
const DashboardLocatario = ({ onLogout }: { onLogout: () => void }) => {
  const [parte, setParte] = useState<ParteLocatario | null>(null)
  const [contratos, setContratos] = useState<any[]>([])
  const [cobrancas, setCobrancas] = useState<any[]>([])
  const [chamados, setChamados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [novoChamado, setNovoChamado] = useState<{ titulo: string; descricao: string; categoria: string; prioridade: string }>({ titulo: '', descricao: '', categoria: 'outros', prioridade: 'media' })
  const [showModal, setShowModal] = useState(false)

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return
    const { data: p } = await supabase.from('contratos_partes').select('id, nome, email, contrato_id').eq('email', user.email).eq('papel', 'locatario').limit(1).single()
    setParte(p as any)
    if (!p) { setLoading(false); return }

    // Buscar todos os contratos do locatário
    const { data: todasPartes } = await supabase.from('contratos_partes').select('contrato_id').eq('email', user.email).eq('papel', 'locatario')
    const ids = (todasPartes || []).map((x: any) => x.contrato_id)

    if (ids.length > 0) {
      const [{ data: cnt }, { data: cob }, { data: cha }] = await Promise.all([
        supabase.from('contratos_locacao').select('id, numero, status, valor_aluguel, valor_condominio, valor_iptu, dia_vencimento, data_inicio, data_fim, imoveis(codigo, titulo, endereco, numero, complemento, bairro_id, cidade)').in('id', ids),
        supabase.from('contratos_cobrancas').select('id, contrato_id, valor, vencimento, status, asaas_invoice_url, asaas_bank_slip_url, pago_em').in('contrato_id', ids).order('vencimento', { ascending: false }).limit(12),
        supabase.from('chamados_manutencao').select('*').in('contrato_id', ids).order('created_at', { ascending: false }),
      ])
      setContratos((cnt || []) as any[])
      setCobrancas((cob || []) as any[])
      setChamados((cha || []) as any[])
    }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  async function abrirChamado() {
    if (!novoChamado.titulo || !parte) return
    const contrato = contratos[0]
    if (!contrato) return
    const { error } = await supabase.from('chamados_manutencao').insert({
      contrato_id: contrato.id,
      imovel_id: contrato.imoveis?.id || null,
      parte_id: parte.id,
      ...novoChamado,
    })
    if (error) { alert('Erro: ' + error.message); return }
    setShowModal(false)
    setNovoChamado({ titulo: '', descricao: '', categoria: 'outros', prioridade: 'media' })
    loadAll()
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-500" size={32} /></div>

  const cobrPendentes = cobrancas.filter((c) => c.status === 'PENDING' || c.status === 'OVERDUE')
  const proximaCobr = cobrPendentes[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header role="Locatário" name={parte?.nome.split(' ')[0] || ''} onLogout={onLogout} />
      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {proximaCobr && (
          <div className={`rounded-xl p-5 text-white ${proximaCobr.status === 'OVERDUE' ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'}`}>
            <p className="text-sm opacity-90">{proximaCobr.status === 'OVERDUE' ? '⚠️ Cobrança vencida' : '📅 Próxima cobrança'}</p>
            <p className="text-3xl font-bold mt-1">{fmt(proximaCobr.valor)}</p>
            <p className="text-sm mt-1">Vencimento: {fmtData(proximaCobr.vencimento)}</p>
            {proximaCobr.asaas_invoice_url && (
              <a href={proximaCobr.asaas_invoice_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white text-blue-700 px-4 py-2 text-sm font-semibold">
                Ver fatura / pagar <ExternalLink size={14} />
              </a>
            )}
          </div>
        )}

        <Card title="Contratos" icon={<FileSignature size={16} />}>
          {contratos.length === 0 ? <Empty>Sem contratos</Empty> : (
            <ul className="divide-y divide-gray-100">
              {contratos.map((c) => (
                <li key={c.id} className="py-3">
                  <p className="font-mono text-xs text-blue-600">{c.numero}</p>
                  <p className="text-sm font-medium mt-1">{c.imoveis?.codigo} - {c.imoveis?.titulo}</p>
                  <p className="text-xs text-gray-500">{c.imoveis?.endereco} {c.imoveis?.numero || ''} · {c.imoveis?.cidade}</p>
                  <p className="text-xs text-gray-500 mt-1">Aluguel: {fmt(c.valor_aluguel)} + Cond: {fmt(c.valor_condominio || 0)} · Vence dia {c.dia_vencimento}</p>
                  <p className="text-xs text-gray-500">Vigência: {fmtData(c.data_inicio)} → {fmtData(c.data_fim)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Cobranças" icon={<Wallet size={16} />}>
          {cobrancas.length === 0 ? <Empty>Nenhuma cobrança</Empty> : (
            <ul className="divide-y divide-gray-100">
              {cobrancas.map((c) => (
                <li key={c.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-medium">{fmtData(c.vencimento)}</p>
                    <p className="text-xs text-gray-500">{fmt(c.valor)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'RECEIVED' || c.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : c.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {c.status === 'RECEIVED' || c.status === 'CONFIRMED' ? 'Pago' : c.status === 'OVERDUE' ? 'Vencido' : 'Pendente'}
                    </span>
                    {c.asaas_invoice_url && (
                      <a href={c.asaas_invoice_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                        Ver <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Chamados de Manutenção" icon={<Wrench size={16} />} action={
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
            <Plus size={12} /> Abrir
          </button>
        }>
          {chamados.length === 0 ? <Empty>Sem chamados abertos</Empty> : (
            <ul className="divide-y divide-gray-100">
              {chamados.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="font-medium text-sm">{c.titulo}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'resolvido' ? 'bg-green-100 text-green-700' : c.status === 'em_atendimento' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {c.status === 'aberto' ? 'Aberto' : c.status === 'em_atendimento' ? 'Em atendimento' : c.status === 'resolvido' ? 'Resolvido' : c.status}
                    </span>
                  </div>
                  {c.descricao && <p className="text-xs text-gray-600 mt-1">{c.descricao}</p>}
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock size={10} /> {fmtData(c.created_at)}</p>
                  {c.resposta && <p className="mt-2 text-xs italic text-gray-700 bg-blue-50 p-2 rounded">Resposta: {c.resposta}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <CtaBox title="Outras dúvidas?" tel="5524000000000" />
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Novo Chamado</h2>
            <div className="space-y-3">
              <input value={novoChamado.titulo} onChange={(e) => setNovoChamado({ ...novoChamado, titulo: e.target.value })} placeholder="Título" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <textarea rows={3} value={novoChamado.descricao} onChange={(e) => setNovoChamado({ ...novoChamado, descricao: e.target.value })} placeholder="Descrição detalhada" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={novoChamado.categoria} onChange={(e) => setNovoChamado({ ...novoChamado, categoria: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="eletrica">Elétrica</option>
                  <option value="hidraulica">Hidráulica</option>
                  <option value="estrutural">Estrutural</option>
                  <option value="eletrodomestico">Eletrodoméstico</option>
                  <option value="outros">Outros</option>
                </select>
                <select value={novoChamado.prioridade} onChange={(e) => setNovoChamado({ ...novoChamado, prioridade: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Cancelar</button>
              <button onClick={abrirChamado} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Abrir Chamado</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Componentes reutilizáveis
// ─────────────────────────────────────────────────────────────────
const Header = ({ role, name, onLogout }: { role: string; name: string; onLogout: () => void }) => (
  <header className="bg-blue-900 text-white">
    <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold">Portal {role}</h1>
        <p className="text-xs text-blue-200">Olá, {name}</p>
      </div>
      <button onClick={onLogout} className="inline-flex items-center gap-1 text-sm text-blue-200 hover:text-white">
        <LogOut size={15} /> Sair
      </button>
    </div>
  </header>
)

const Card = ({ title, icon, children, action }: { title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) => (
  <section className="bg-white rounded-xl border border-gray-200 p-5">
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-semibold text-gray-800 flex items-center gap-2">{icon} {title}</h2>
      {action}
    </div>
    {children}
  </section>
)

const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-gray-500 py-4 text-center">{children}</p>

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

const CtaBox = ({ title, tel }: { title: string; tel: string }) => (
  <section className="bg-blue-50 rounded-xl border border-blue-200 p-5 text-center">
    <FileText className="mx-auto text-blue-600 mb-2" size={28} />
    <h3 className="font-semibold text-blue-900">{title}</h3>
    <p className="text-sm text-blue-700 mt-1 mb-3">Entre em contato com a Moradda.</p>
    <a href={`https://wa.me/${tel}`} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
      Falar pelo WhatsApp <ArrowRight size={14} />
    </a>
  </section>
)

export default Portal
