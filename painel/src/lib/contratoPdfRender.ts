// Renderiza Markdown de contrato em PDF profissional com layout Moradda.
// Suporta: # ## ### · **bold** · *italic* · listas · --- · parágrafos justificados.

import jsPDF from 'jspdf'
import logoMoradda from '@/assets/logo.png'

interface RenderOpts {
  markdown: string
  numero?: string
  filename?: string
}

const COLOR_PRIMARY = [20, 50, 80] as const // Moradda blue
const COLOR_GOLD    = [184, 137, 104] as const
const COLOR_TEXT    = [30, 30, 30] as const
const COLOR_MUTED   = [120, 120, 120] as const

const PAGE = {
  margin: 20,    // mm
  topHeader: 25, // espaço pro header
  bottomFooter: 18,
  watermarkOpacity: 0.04,
}

let logoDataUrlCache: string | null = null
async function loadLogo(): Promise<string | null> {
  if (logoDataUrlCache) return logoDataUrlCache
  try {
    const res = await fetch(logoMoradda)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const fr = new FileReader()
      fr.onloadend = () => { logoDataUrlCache = fr.result as string; resolve(logoDataUrlCache) }
      fr.onerror = () => resolve(null)
      fr.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

interface Block {
  type: 'h1' | 'h2' | 'h3' | 'p' | 'hr' | 'li' | 'spacer' | 'signatureLine'
  text?: string
  ordered?: boolean
}

function parseMarkdown(md: string): Block[] {
  const blocks: Block[] = []
  const lines = md.split('\n')

  let buffer = ''
  const flush = () => {
    if (buffer.trim()) {
      blocks.push({ type: 'p', text: buffer.trim() })
    }
    buffer = ''
  }

  for (let raw of lines) {
    const line = raw.trim()
    if (!line) {
      flush()
      blocks.push({ type: 'spacer' })
      continue
    }
    if (line === '---') { flush(); blocks.push({ type: 'hr' }); continue }
    if (line.startsWith('### ')) { flush(); blocks.push({ type: 'h3', text: line.slice(4) }); continue }
    if (line.startsWith('## ')) { flush(); blocks.push({ type: 'h2', text: line.slice(3) }); continue }
    if (line.startsWith('# ')) { flush(); blocks.push({ type: 'h1', text: line.slice(2) }); continue }
    if (line.match(/^[-*]\s+/) || line.match(/^\d+\.\s+/)) {
      flush()
      blocks.push({ type: 'li', text: line.replace(/^[-*]\s+|^\d+\.\s+/, ''), ordered: !!line.match(/^\d+\./) })
      continue
    }
    if (line.match(/^_{3,}/)) {
      flush()
      blocks.push({ type: 'signatureLine' })
      continue
    }
    buffer = buffer ? buffer + ' ' + line : line
  }
  flush()
  return blocks
}

// Renderiza texto com **bold** e *italic* inline mantendo justificação
function drawRichText(doc: jsPDF, text: string, x: number, y: number, opts: { maxW: number; size: number; align?: 'left' | 'justify' | 'center' | 'right'; lineHeight?: number }): number {
  const { maxW, size } = opts
  const lh = opts.lineHeight ?? size * 0.5
  doc.setFontSize(size)
  doc.setFont('times', 'normal')

  // Tokenize: split on **bold** and *italic*
  type Token = { text: string; bold: boolean; italic: boolean }
  const tokens: Token[] = []
  let bold = false, italic = false
  let cur = ''
  let i = 0
  while (i < text.length) {
    if (text.startsWith('**', i)) {
      if (cur) { tokens.push({ text: cur, bold, italic }); cur = '' }
      bold = !bold
      i += 2
      continue
    }
    if (text[i] === '*' && text[i+1] !== '*') {
      if (cur) { tokens.push({ text: cur, bold, italic }); cur = '' }
      italic = !italic
      i += 1
      continue
    }
    cur += text[i]
    i++
  }
  if (cur) tokens.push({ text: cur, bold, italic })

  // Flatten to words preserving styling
  type Word = { text: string; bold: boolean; italic: boolean; w: number }
  const words: Word[] = []
  for (const t of tokens) {
    const parts = t.text.split(/(\s+)/)
    for (const p of parts) {
      if (!p) continue
      doc.setFont('times', t.bold && t.italic ? 'bolditalic' : t.bold ? 'bold' : t.italic ? 'italic' : 'normal')
      const w = doc.getTextWidth(p)
      words.push({ text: p, bold: t.bold, italic: t.italic, w })
    }
  }

  // Layout linhas
  const lines: Word[][] = []
  let line: Word[] = []
  let lineW = 0
  for (const word of words) {
    if (lineW + word.w > maxW && line.length > 0) {
      // remove trailing whitespace
      while (line.length && line[line.length - 1].text.match(/^\s+$/)) line.pop()
      lines.push(line)
      line = []
      lineW = 0
      if (word.text.match(/^\s+$/)) continue
    }
    line.push(word)
    lineW += word.w
  }
  if (line.length) {
    while (line.length && line[line.length - 1].text.match(/^\s+$/)) line.pop()
    lines.push(line)
  }

  // Desenha linha por linha
  for (let li = 0; li < lines.length; li++) {
    const ln = lines[li]
    const isLast = li === lines.length - 1
    const align = opts.align || 'left'

    // Calcular largura útil
    let totalW = 0
    let spaceCount = 0
    for (const w of ln) {
      totalW += w.w
      if (w.text.match(/^\s+$/)) spaceCount++
    }

    let cx = x
    let extraSpace = 0
    if (align === 'center') cx = x + (maxW - totalW) / 2
    else if (align === 'right') cx = x + (maxW - totalW)
    else if (align === 'justify' && !isLast && spaceCount > 0) {
      extraSpace = (maxW - totalW) / spaceCount
    }

    for (const w of ln) {
      doc.setFont('times', w.bold && w.italic ? 'bolditalic' : w.bold ? 'bold' : w.italic ? 'italic' : 'normal')
      doc.text(w.text, cx, y)
      cx += w.w + (w.text.match(/^\s+$/) ? extraSpace : 0)
    }
    y += lh
  }

  return y
}

function drawHeader(doc: jsPDF, logo: string | null, numero?: string) {
  const W = doc.internal.pageSize.getWidth()
  const h = 18
  // Background bar
  doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2])
  doc.rect(0, 0, W, h, 'F')
  // Logo
  if (logo) {
    try { doc.addImage(logo, 'PNG', PAGE.margin, 4, 12, 12, undefined, 'FAST') } catch {}
  }
  // Brand
  doc.setTextColor(255, 255, 255)
  doc.setFont('times', 'bold')
  doc.setFontSize(13)
  doc.text('MORADDA IMOBILIÁRIA', PAGE.margin + (logo ? 16 : 0), 11)
  doc.setFont('times', 'normal')
  doc.setFontSize(7.5)
  doc.text('moradda.com.br · contato@moradda.com.br', PAGE.margin + (logo ? 16 : 0), 15)
  // Numero
  if (numero) {
    doc.setFontSize(9)
    doc.setFont('times', 'bold')
    doc.text(`Contrato Nº ${numero}`, W - PAGE.margin, 11, { align: 'right' })
    doc.setFont('times', 'normal')
    doc.setFontSize(7.5)
    doc.text(new Date().toLocaleDateString('pt-BR'), W - PAGE.margin, 15, { align: 'right' })
  }
  // Gold accent line
  doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2])
  doc.rect(0, h, W, 0.6, 'F')
}

function drawFooter(doc: jsPDF, page: number, total: number, numero?: string) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.2)
  doc.line(PAGE.margin, H - 12, W - PAGE.margin, H - 12)
  doc.setFontSize(7.5)
  doc.setFont('times', 'normal')
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2])
  doc.text('Moradda Imobiliária', PAGE.margin, H - 7)
  if (numero) doc.text(`Contrato Nº ${numero}`, W / 2, H - 7, { align: 'center' })
  doc.text(`Página ${page} de ${total}`, W - PAGE.margin, H - 7, { align: 'right' })
}

function drawWatermark(doc: jsPDF, logo: string | null) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  doc.saveGraphicsState()
  // @ts-expect-error setGState exists
  doc.setGState(new doc.GState({ opacity: PAGE.watermarkOpacity }))

  // Logo grande no centro
  if (logo) {
    try {
      const size = 120
      doc.addImage(logo, 'PNG', (W - size) / 2, (H - size) / 2, size, size, undefined, 'FAST')
    } catch {}
  }

  // Texto MORADDA também (camada extra)
  doc.setTextColor(20, 50, 80)
  doc.setFont('times', 'bold')
  doc.setFontSize(56)
  doc.text('MORADDA', W / 2, H / 2 + 70, { align: 'center', angle: 30 })

  doc.restoreGraphicsState()
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2])
}

export async function renderContratoPdfFromMarkdown(opts: RenderOpts): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const maxW = W - PAGE.margin * 2
  const logo = await loadLogo()

  const blocks = parseMarkdown(opts.markdown)

  let y = PAGE.topHeader
  const startNewPage = (firstPage = false) => {
    if (!firstPage) doc.addPage()
    drawHeader(doc, logo, opts.numero)
    drawWatermark(doc, logo)
    y = PAGE.topHeader
  }
  const ensureSpace = (needed: number) => {
    if (y + needed > H - PAGE.bottomFooter) startNewPage()
  }

  startNewPage(true)
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2])

  for (const block of blocks) {
    switch (block.type) {
      case 'spacer':
        y += 2
        break
      case 'hr':
        ensureSpace(4)
        doc.setDrawColor(180, 180, 180)
        doc.setLineWidth(0.3)
        doc.line(PAGE.margin, y, W - PAGE.margin, y)
        y += 4
        break
      case 'h1':
        ensureSpace(16)
        y += 4
        doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2])
        y = drawRichText(doc, block.text || '', PAGE.margin, y + 6, { maxW, size: 16, align: 'center', lineHeight: 7 })
        // gold underline
        doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2])
        doc.setLineWidth(0.5)
        doc.line(W / 2 - 30, y + 1, W / 2 + 30, y + 1)
        y += 6
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2])
        break
      case 'h2':
        ensureSpace(10)
        y += 4
        doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2])
        y = drawRichText(doc, block.text || '', PAGE.margin, y + 4, { maxW, size: 11, lineHeight: 5.5 })
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2])
        y += 1
        break
      case 'h3':
        ensureSpace(8)
        y += 2
        doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2])
        y = drawRichText(doc, '**' + (block.text || '') + '**', PAGE.margin, y + 4, { maxW, size: 10, lineHeight: 5 })
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2])
        break
      case 'li': {
        ensureSpace(8)
        const bullet = block.ordered ? '•' : '•'
        doc.setFont('times', 'normal'); doc.setFontSize(10)
        doc.text(bullet, PAGE.margin + 2, y + 4)
        y = drawRichText(doc, block.text || '', PAGE.margin + 6, y + 4, { maxW: maxW - 6, size: 10, align: 'justify', lineHeight: 5 })
        break
      }
      case 'signatureLine':
        ensureSpace(15)
        y += 6
        doc.setDrawColor(50, 50, 50)
        doc.setLineWidth(0.4)
        doc.line(PAGE.margin + 10, y, W - PAGE.margin - 10, y)
        y += 10
        break
      case 'p':
      default:
        ensureSpace(8)
        y = drawRichText(doc, block.text || '', PAGE.margin, y + 4, { maxW, size: 10, align: 'justify', lineHeight: 5 })
        y += 1
        break
    }
  }

  // Footers
  const total = (doc.internal as any).pages.length - 1
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    drawFooter(doc, i, total, opts.numero)
  }

  return doc
}

export async function gerarPdfContratoBase64FromMd(md: string, numero?: string): Promise<string> {
  const doc = await renderContratoPdfFromMarkdown({ markdown: md, numero })
  const dataUri = doc.output('datauristring')
  const idx = dataUri.indexOf('base64,')
  return idx >= 0 ? dataUri.substring(idx + 7) : dataUri
}

export async function downloadPdfContratoFromMd(md: string, numero?: string, filename?: string) {
  const doc = await renderContratoPdfFromMarkdown({ markdown: md, numero })
  doc.save(filename || `Contrato_${numero?.replace('/', '-') || 'rascunho'}.pdf`)
}
