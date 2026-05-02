import { useEffect, useMemo, useState } from "react"
import { X, MessageCircle, Camera, Link2, Mail, Copy, Check, Download, Loader2, Image as ImageIcon } from "lucide-react"
import JSZip from "jszip"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import type { ImovelShare } from "@/lib/share"
import {
  captionInstagram,
  linkEmail,
  linkWhatsApp,
  textoLinkCopy,
  textoWhatsApp,
  urlPublicaImovel,
} from "@/lib/share"

type Tab = "whatsapp" | "instagram" | "link"

interface Props {
  open: boolean
  onClose: () => void
  imovelId: string
}

interface FotoLite {
  id: string
  url: string
  url_watermark: string | null
  ordem: number
  principal: boolean
}

const ShareImovelModal = ({ open, onClose, imovelId }: Props) => {
  const [tab, setTab] = useState<Tab>("whatsapp")
  const [imovel, setImovel] = useState<ImovelShare | null>(null)
  const [fotos, setFotos] = useState<FotoLite[]>([])
  const [loading, setLoading] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [baixandoFotos, setBaixandoFotos] = useState(false)

  useEffect(() => {
    if (!open || !imovelId) return
    setLoading(true)
    ;(async () => {
      const { data: imv } = await supabase
        .from("imoveis")
        .select(
          "id, codigo, slug, titulo, tipo, finalidade, preco, condominio, iptu_anual, area_total, area_construida, quartos, suites, banheiros, vagas, endereco, numero, complemento, cep, cidade, estado, descricao, caracteristicas, bairros(nome)"
        )
        .eq("id", imovelId)
        .single()

      if (imv) {
        setImovel({
          ...imv,
          bairro_nome: (imv as any).bairros?.nome || null,
        } as any)
      }

      const { data: fts } = await supabase
        .from("imoveis_fotos")
        .select("id, url, url_watermark, ordem, principal")
        .eq("imovel_id", imovelId)
        .order("ordem")
      setFotos((fts || []) as FotoLite[])
      setLoading(false)
    })()
  }, [open, imovelId])

  const textoWA = useMemo(() => (imovel ? textoWhatsApp(imovel) : ""), [imovel])
  const textoIG = useMemo(() => (imovel ? captionInstagram(imovel) : ""), [imovel])
  const textoCopy = useMemo(() => (imovel ? textoLinkCopy(imovel) : ""), [imovel])
  const linkPublico = useMemo(() => (imovel ? urlPublicaImovel(imovel) : ""), [imovel])

  function copiar(key: string, valor: string) {
    navigator.clipboard.writeText(valor).then(
      () => {
        setCopiedKey(key)
        toast.success("Copiado!")
        setTimeout(() => setCopiedKey(null), 1500)
      },
      () => toast.error("Erro ao copiar")
    )
  }

  async function baixarFotosPraPost() {
    if (fotos.length === 0) {
      toast.error("Nenhuma foto disponível")
      return
    }
    setBaixandoFotos(true)
    try {
      const zip = new JSZip()
      let ok = 0
      let fail = 0
      const codigo = (imovel?.codigo || "imovel").replace(/[^a-zA-Z0-9-_]/g, "")
      await Promise.all(
        fotos.map(async (f, idx) => {
          const url = f.url_watermark || f.url
          if (!url) {
            fail++
            return
          }
          try {
            const res = await fetch(url)
            const blob = await res.blob()
            const ext = (url.split("?")[0].match(/\.([a-zA-Z0-9]+)$/)?.[1] || "jpg").toLowerCase()
            zip.file(`${codigo}-foto-${String(idx + 1).padStart(2, "0")}.${ext}`, blob)
            ok++
          } catch {
            fail++
          }
        })
      )
      if (ok === 0) {
        toast.error("Nenhuma foto pôde ser baixada")
        return
      }
      const content = await zip.generateAsync({ type: "blob" })
      const blobUrl = URL.createObjectURL(content)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = `${codigo}-fotos-post.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
      toast.success(`${ok} foto(s) baixada(s)${fail ? ` · ${fail} falha(s)` : ""}`)
    } catch (err: any) {
      toast.error("Erro: " + (err.message || ""))
    } finally {
      setBaixandoFotos(false)
    }
  }

  function abrirWhatsAppWeb() {
    if (!imovel) return
    window.open(linkWhatsApp(imovel), "_blank", "noopener,noreferrer")
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Compartilhar imóvel</h2>
            {imovel && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {imovel.codigo ? `Cód. ${imovel.codigo} · ` : ""}{imovel.titulo || imovel.tipo}
              </p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-moradda-blue-500" />
          </div>
        ) : !imovel ? (
          <div className="p-8 text-center text-sm text-gray-500">Imóvel não encontrado.</div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 px-4">
              <TabBtn active={tab === "whatsapp"} onClick={() => setTab("whatsapp")} icon={<MessageCircle size={15} />}>
                WhatsApp
              </TabBtn>
              <TabBtn active={tab === "instagram"} onClick={() => setTab("instagram")} icon={<Camera size={15} />}>
                Instagram
              </TabBtn>
              <TabBtn active={tab === "link"} onClick={() => setTab("link")} icon={<Link2 size={15} />}>
                Link & E-mail
              </TabBtn>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6">
              {tab === "whatsapp" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Texto pronto pra colar no WhatsApp ou enviar pra um cliente específico.
                  </p>
                  <textarea
                    readOnly
                    rows={14}
                    value={textoWA}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono whitespace-pre-wrap focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={abrirWhatsAppWeb}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      <MessageCircle size={15} />
                      Abrir WhatsApp
                    </button>
                    <button
                      onClick={() => copiar("wa", textoWA)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      {copiedKey === "wa" ? <Check size={15} /> : <Copy size={15} />}
                      {copiedKey === "wa" ? "Copiado!" : "Copiar texto"}
                    </button>
                    <button
                      onClick={baixarFotosPraPost}
                      disabled={baixandoFotos || fotos.length === 0}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      {baixandoFotos ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                      {baixandoFotos ? "Compactando..." : `Baixar fotos (${fotos.length})`}
                    </button>
                  </div>
                </div>
              )}

              {tab === "instagram" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Caption pronta com hashtags. Baixe as fotos e poste pelo Instagram (feed ou carrossel).
                  </p>
                  <textarea
                    readOnly
                    rows={14}
                    value={textoIG}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono whitespace-pre-wrap focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => copiar("ig", textoIG)}
                      className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
                    >
                      {copiedKey === "ig" ? <Check size={15} /> : <Copy size={15} />}
                      {copiedKey === "ig" ? "Copiado!" : "Copiar caption"}
                    </button>
                    <button
                      onClick={baixarFotosPraPost}
                      disabled={baixandoFotos || fotos.length === 0}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      {baixandoFotos ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
                      {baixandoFotos ? "Compactando..." : `Baixar fotos (${fotos.length})`}
                    </button>
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/40 dark:text-amber-200">
                    💡 <strong>Dica:</strong> baixe as fotos e use no Instagram/Stories. Em breve, post automático direto daqui.
                  </div>
                </div>
              )}

              {tab === "link" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Link público do imóvel
                    </label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={linkPublico}
                        className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                      />
                      <button
                        onClick={() => copiar("link", linkPublico)}
                        className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600"
                      >
                        {copiedKey === "link" ? <Check size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Texto curto (link + título)
                    </label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={textoCopy}
                        className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                      />
                      <button
                        onClick={() => copiar("short", textoCopy)}
                        className="inline-flex items-center gap-2 rounded-lg bg-moradda-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-moradda-blue-600"
                      >
                        {copiedKey === "short" ? <Check size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Compartilhar via:</p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={imovel ? linkEmail(imovel) : "#"}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      >
                        <Mail size={15} />
                        E-mail
                      </a>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkPublico)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      >
                        Facebook
                      </a>
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(textoCopy)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      >
                        Twitter / X
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const TabBtn = ({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
      active
        ? "border-moradda-blue-500 text-moradda-blue-600 dark:text-moradda-blue-400"
        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    }`}
  >
    {icon}
    {children}
  </button>
)

export default ShareImovelModal
