// Helpers para gerar textos de compartilhamento de imóveis
// (WhatsApp, Instagram, link copy)

export const SITE_URL = "https://moraddaimobiliaria.com.br"

export interface ImovelShare {
  id: string
  codigo?: string | null
  slug?: string | null
  titulo?: string | null
  tipo?: string | null
  finalidade?: string | null
  preco?: number | null
  condominio?: number | null
  iptu_anual?: number | null
  area_total?: number | null
  area_construida?: number | null
  quartos?: number | null
  suites?: number | null
  banheiros?: number | null
  vagas?: number | null
  endereco?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  bairro_nome?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
  descricao?: string | null
  caracteristicas?: string[] | null
}

export function urlPublicaImovel(imovel: { slug?: string | null; id: string }) {
  const slug = imovel.slug || imovel.id
  return `${SITE_URL}/imoveis/${slug}`
}

export function fmtMoeda(v?: number | null) {
  if (v == null || isNaN(v)) return ""
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 })
}

function fmtFinalidade(f?: string | null) {
  if (!f) return ""
  const map: Record<string, string> = {
    venda: "Venda",
    locacao: "Aluguel",
    aluguel: "Aluguel",
    temporada: "Temporada",
  }
  return map[f.toLowerCase()] || f
}

function emoji(tipo?: string | null) {
  if (!tipo) return "🏠"
  const t = tipo.toLowerCase()
  if (t.includes("apartamento")) return "🏢"
  if (t.includes("cobertura")) return "🌆"
  if (t.includes("casa")) return "🏡"
  if (t.includes("comercial") || t.includes("sala")) return "🏬"
  if (t.includes("terreno") || t.includes("lote")) return "🌳"
  if (t.includes("chacara") || t.includes("sitio") || t.includes("rural") || t.includes("fazenda")) return "🌾"
  return "🏠"
}

function linhaCaracteristicas(im: ImovelShare): string[] {
  const linhas: string[] = []
  const partes: string[] = []
  if (im.area_construida) partes.push(`📐 ${im.area_construida} m² construídos`)
  else if (im.area_total) partes.push(`📐 ${im.area_total} m²`)
  if (im.quartos) partes.push(`🛏️ ${im.quartos} ${im.quartos === 1 ? "quarto" : "quartos"}${im.suites ? ` (${im.suites} suíte${im.suites > 1 ? "s" : ""})` : ""}`)
  if (im.banheiros) partes.push(`🚿 ${im.banheiros} ${im.banheiros === 1 ? "banheiro" : "banheiros"}`)
  if (im.vagas) partes.push(`🚗 ${im.vagas} ${im.vagas === 1 ? "vaga" : "vagas"}`)
  if (partes.length) linhas.push(partes.join("  •  "))
  return linhas
}

function localizacao(im: ImovelShare): string {
  const parts: string[] = []
  const bairro = im.bairro_nome || im.bairro
  if (bairro) parts.push(bairro)
  if (im.cidade) parts.push(im.cidade)
  if (im.estado) parts.push(im.estado)
  return parts.join(" - ")
}

function precoLinha(im: ImovelShare): string {
  const partes: string[] = []
  if (im.finalidade?.toLowerCase() === "venda") {
    if (im.preco) partes.push(`💰 ${fmtMoeda(im.preco)}`)
  } else {
    if (im.preco) partes.push(`💰 ${fmtMoeda(im.preco)}/mês`)
    if (im.condominio) partes.push(`+ Cond: ${fmtMoeda(im.condominio)}`)
  }
  return partes.join("  ")
}

// ─────────────────────────────────────────────────────────
// WhatsApp — texto para envio direto (mensagem ou status)
// ─────────────────────────────────────────────────────────
export function textoWhatsApp(im: ImovelShare): string {
  const linhas: string[] = []
  const e = emoji(im.tipo)
  const fin = fmtFinalidade(im.finalidade).toUpperCase()
  linhas.push(`${e} *${im.titulo || im.tipo || "Imóvel"}*`)
  if (fin) linhas.push(`📌 ${fin}`)
  const loc = localizacao(im)
  if (loc) linhas.push(`📍 ${loc}`)
  linhas.push("")
  const preco = precoLinha(im)
  if (preco) linhas.push(preco)
  const carac = linhaCaracteristicas(im)
  if (carac.length) linhas.push(...carac)
  if (im.descricao) {
    linhas.push("")
    const d = im.descricao.length > 280 ? im.descricao.substring(0, 280).trim() + "..." : im.descricao
    linhas.push(d)
  }
  if (im.codigo) {
    linhas.push("")
    linhas.push(`🔖 Cód.: ${im.codigo}`)
  }
  linhas.push("")
  linhas.push(`👉 Veja mais: ${urlPublicaImovel(im)}`)
  linhas.push("")
  linhas.push("_Moradda Imobiliária_")
  return linhas.join("\n")
}

export function linkWhatsApp(im: ImovelShare, telefone?: string): string {
  const texto = textoWhatsApp(im)
  const tel = (telefone || "").replace(/\D/g, "")
  const base = tel ? `https://wa.me/${tel}` : `https://wa.me/`
  return `${base}?text=${encodeURIComponent(texto)}`
}

// ─────────────────────────────────────────────────────────
// Instagram — caption pra post (feed/carrossel)
// ─────────────────────────────────────────────────────────
export function captionInstagram(im: ImovelShare): string {
  const linhas: string[] = []
  const e = emoji(im.tipo)
  const fin = fmtFinalidade(im.finalidade).toUpperCase()
  linhas.push(`${e} ${im.titulo || im.tipo || "Imóvel"}`)
  if (fin) linhas.push(`📌 ${fin}`)
  const loc = localizacao(im)
  if (loc) linhas.push(`📍 ${loc}`)
  linhas.push("")
  const preco = precoLinha(im)
  if (preco) linhas.push(preco)
  const carac = linhaCaracteristicas(im)
  if (carac.length) linhas.push(...carac)
  if (im.descricao) {
    linhas.push("")
    const d = im.descricao.length > 500 ? im.descricao.substring(0, 500).trim() + "..." : im.descricao
    linhas.push(d)
  }
  linhas.push("")
  linhas.push("📲 Agende uma visita pelo nosso site:")
  linhas.push(urlPublicaImovel(im))
  linhas.push("")
  linhas.push("📞 Ou fale com a gente no WhatsApp · link na bio")
  if (im.codigo) {
    linhas.push("")
    linhas.push(`Cód.: ${im.codigo}`)
  }
  linhas.push("")
  linhas.push(hashtagsInstagram(im))
  return linhas.join("\n")
}

function hashtagsInstagram(im: ImovelShare): string {
  const tags = new Set<string>()
  tags.add("#moradda")
  tags.add("#moraddaimobiliaria")
  tags.add("#imoveis")
  if (im.finalidade?.toLowerCase() === "venda") tags.add("#imovelavenda")
  else tags.add("#aluguel"), tags.add("#imovelparaalugar")
  if (im.tipo) {
    const t = im.tipo.toLowerCase().replace(/[^a-z0-9]/g, "")
    tags.add(`#${t}`)
  }
  if (im.cidade) {
    const c = im.cidade.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "")
    if (c) {
      tags.add(`#${c}`)
      tags.add(`#imoveis${c}`)
    }
  }
  const bairro = im.bairro_nome || im.bairro
  if (bairro) {
    const b = bairro.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "")
    if (b) tags.add(`#${b}`)
  }
  tags.add("#imobiliaria")
  tags.add("#realestate")
  tags.add("#novolar")
  tags.add("#mudei")
  return Array.from(tags).slice(0, 20).join(" ")
}

// ─────────────────────────────────────────────────────────
// Texto curto / link copy
// ─────────────────────────────────────────────────────────
export function textoLinkCopy(im: ImovelShare): string {
  const e = emoji(im.tipo)
  const tit = im.titulo || im.tipo || "Imóvel"
  const preco = precoLinha(im)
  const link = urlPublicaImovel(im)
  return `${e} ${tit}${preco ? ` · ${preco}` : ""} · ${link}`
}

// E-mail (mailto)
export function linkEmail(im: ImovelShare): string {
  const subject = `${emoji(im.tipo)} ${im.titulo || im.tipo || "Imóvel"} - Moradda`
  const body = textoWhatsApp(im).replace(/\*/g, "").replace(/_/g, "")
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
