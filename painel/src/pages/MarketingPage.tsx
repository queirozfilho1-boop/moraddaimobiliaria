import { useEffect, useState } from 'react'
import { Camera, MessageCircle, Loader2, Send, AlertCircle, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { captionInstagram, textoWhatsApp, type ImovelShare } from '@/lib/share'

const SUPA_FN = `${import.meta.env.VITE_SUPABASE_URL || 'https://mvzjqktgnwjwuinnxxcc.supabase.co'}/functions/v1`

const MarketingPage = () => {
  const [tab, setTab] = useState<'instagram' | 'whatsapp' | 'config'>('instagram')
  const [imoveis, setImoveis] = useState<any[]>([])
  const [imovelId, setImovelId] = useState('')
  const [loading, setLoading] = useState(false)
  const [caption, setCaption] = useState('')
  const [waMsg, setWaMsg] = useState('')
  const [destinatarios, setDestinatarios] = useState('')

  useEffect(() => {
    supabase.from('imoveis').select('*, bairros(nome), imoveis_fotos(url, url_watermark, ordem, principal)').eq('status', 'publicado').order('codigo').then(({ data }) => {
      setImoveis(data || [])
    })
  }, [])

  function selectImovel(id: string) {
    setImovelId(id)
    const im = imoveis.find((x) => x.id === id)
    if (im) {
      const share: ImovelShare = { ...im, bairro_nome: im.bairros?.nome }
      setCaption(captionInstagram(share))
      setWaMsg(textoWhatsApp(share))
    }
  }

  async function postInstagram() {
    if (!imovelId) { toast.error('Selecione um imóvel'); return }
    const im = imoveis.find((x) => x.id === imovelId)
    const fotos = (im?.imoveis_fotos || []).sort((a: any, b: any) => {
      if (a.principal && !b.principal) return -1
      if (b.principal && !a.principal) return 1
      return (a.ordem ?? 0) - (b.ordem ?? 0)
    }).slice(0, 10)
    if (fotos.length === 0) { toast.error('Imóvel sem fotos'); return }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPA_FN}/instagram-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({
          imovel_id: imovelId,
          caption,
          image_urls: fotos.map((f: any) => f.url_watermark || f.url),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'erro')
      toast.success('Postado no Instagram · ID ' + data.post_id)
    } catch (err: any) {
      toast.error('Erro: ' + err.message)
    } finally { setLoading(false) }
  }

  async function enviarWhatsappMassa() {
    if (!waMsg) { toast.error('Mensagem vazia'); return }
    const tels = destinatarios.split(/[\n,;]/).map((t) => t.trim().replace(/\D/g, '')).filter((t) => t.length >= 10)
    if (tels.length === 0) { toast.error('Adicione pelo menos um telefone'); return }
    if (!confirm(`Enviar mensagem para ${tels.length} contato(s)?`)) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPA_FN}/whatsapp-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ destinatarios: tels, mensagem: waMsg, imovel_id: imovelId || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'erro')
      toast.success(`${data.enviados} enviado(s) · ${data.falharam} falha(s)`)
    } catch (err: any) {
      toast.error('Erro: ' + err.message)
    } finally { setLoading(false) }
  }

  const tabBtn = (k: typeof tab, label: string, icon: React.ReactNode) => (
    <button onClick={() => setTab(k)} className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition ${tab === k ? 'border-moradda-blue-500 text-moradda-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
      {icon} {label}
    </button>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Marketing Automatizado</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Auto-post Instagram + WhatsApp em massa via Meta API</p>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-4">
        {tabBtn('instagram', 'Instagram', <Camera size={15} />)}
        {tabBtn('whatsapp', 'WhatsApp Massa', <MessageCircle size={15} />)}
        {tabBtn('config', 'Configuração', <Settings size={15} />)}
      </div>

      {tab === 'instagram' && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div>
            <label className="text-xs uppercase tracking-wider text-gray-600 mb-1 block">Imóvel</label>
            <select value={imovelId} onChange={(e) => selectImovel(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700">
              <option value="">Selecione...</option>
              {imoveis.map((i) => <option key={i.id} value={i.id}>{i.codigo} - {i.titulo}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-gray-600 mb-1 block">Caption</label>
            <textarea rows={10} value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono dark:border-gray-600 dark:bg-gray-700" />
          </div>
          <button onClick={postInstagram} disabled={loading || !imovelId} className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Postar agora no Instagram
          </button>
          <p className="text-xs text-gray-500">📸 Postará as fotos do imóvel (até 10) como carrossel · com a caption acima</p>
        </div>
      )}

      {tab === 'whatsapp' && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div>
            <label className="text-xs uppercase tracking-wider text-gray-600 mb-1 block">Imóvel (opcional)</label>
            <select value={imovelId} onChange={(e) => selectImovel(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700">
              <option value="">— sem imóvel específico —</option>
              {imoveis.map((i) => <option key={i.id} value={i.id}>{i.codigo} - {i.titulo}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-gray-600 mb-1 block">Mensagem</label>
            <textarea rows={8} value={waMsg} onChange={(e) => setWaMsg(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-gray-600 mb-1 block">Destinatários</label>
            <textarea rows={5} value={destinatarios} onChange={(e) => setDestinatarios(e.target.value)} placeholder="Um telefone por linha · 5524999999999" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono dark:border-gray-600 dark:bg-gray-700" />
          </div>
          <button onClick={enviarWhatsappMassa} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Disparar para todos
          </button>
        </div>
      )}

      {tab === 'config' && (
        <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800/40 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300">Configuração necessária no Supabase</h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                Pra usar Auto-post Instagram e WhatsApp em massa, você precisa configurar 4 secrets:
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
            <h4 className="font-semibold text-sm mb-2">📸 Instagram (Meta Graph API)</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside text-gray-700 dark:text-gray-300">
              <li>Conta Instagram <strong>Business</strong> conectada à Página Facebook</li>
              <li>Acesse <a href="https://developers.facebook.com" target="_blank" className="text-blue-600 underline">developers.facebook.com</a> → criar App tipo <strong>Business</strong></li>
              <li>Habilite produto <strong>Instagram Graph API</strong></li>
              <li>Gere token de longa duração (60 dias renovável)</li>
              <li>No Supabase: Settings → Edge Functions → Add Secrets:
                <ul className="ml-6 mt-1 list-disc">
                  <li><code>META_PAGE_TOKEN</code> = token gerado</li>
                  <li><code>META_IG_BUSINESS_ID</code> = ID da conta Instagram Business</li>
                </ul>
              </li>
            </ol>
          </div>

          <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
            <h4 className="font-semibold text-sm mb-2">📱 WhatsApp (Cloud API)</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside text-gray-700 dark:text-gray-300">
              <li>Acesse <a href="https://business.facebook.com" target="_blank" className="text-blue-600 underline">business.facebook.com</a> → WhatsApp Business Platform</li>
              <li>Cadastre número de telefone</li>
              <li>1.000 mensagens/mês grátis · depois ~R$ 0,05-0,07 por conversa</li>
              <li>Secrets:
                <ul className="ml-6 mt-1 list-disc">
                  <li><code>WHATSAPP_PHONE_ID</code> = Phone Number ID</li>
                  <li><code>WHATSAPP_TOKEN</code> = Permanent Access Token</li>
                </ul>
              </li>
              <li>Pra envio em massa fora dos 24h da última conversa, precisa <strong>templates aprovados</strong> pela Meta.</li>
            </ol>
          </div>

          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
            💡 <strong>Por enquanto</strong>, o "Compartilhar 1-clique" no editor de imóvel funciona <strong>sem precisar configurar nada</strong> — usa link wa.me que abre o WhatsApp do navegador com a mensagem pronta.
          </div>
        </div>
      )}
    </div>
  )
}

export default MarketingPage
