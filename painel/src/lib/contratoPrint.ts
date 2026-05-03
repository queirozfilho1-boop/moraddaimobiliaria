// Renderiza Markdown de contrato em HTML + CSS profissional e abre janela
// com auto-print. O browser gera o PDF respeitando @page CSS (margens,
// header/footer, paginação) — visual idêntico ao mockup Moradda.

import contratoCss from './contratoStyle.css?raw'

// BOM UTF-8 (﻿) prefixado força browsers a interpretarem o blob
// como UTF-8 mesmo quando o MIME charset não é respeitado, garantindo
// que acentos vindos do banco (Acácias, Aliança, Petrópolis) renderizem
// corretamente no PDF. Sem ele, alguns mecanismos de PDF caem em Latin-1
// e produzem mojibake (Ac�cias, Alian�a).
const UTF8_BOM = '﻿'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Whitelist de tags HTML simples permitidas dentro do markdown — preservadas
// durante o escape pra que cheguem intactas ao DOM final.
// Estratégia: substituir cada match por placeholder \x00N\x00, fazer o
// escape geral, depois restaurar os placeholders pelas tags originais.
const ALLOWED_TAG_RE = new RegExp(
  [
    '<br\\s*/?>',
    '<hr\\s*/?>',
    '</?strong>',
    '</?em>',
    '</?b>',
    '</?i>',
    '</?u>',
    '<div\\s+class="[^"<>]*"\\s*>',
    '</div>',
    '<span\\s+class="[^"<>]*"\\s*>',
    '</span>',
  ].join('|'),
  'gi'
)

function escapeHtmlPreservandoTags(s: string): string {
  const guardadas: string[] = []
  const comGuardas = s.replace(ALLOWED_TAG_RE, (m) => {
    const idx = guardadas.length
    guardadas.push(m)
    return `\x00TAG${idx}\x00`
  })
  const escapado = escapeHtml(comGuardas)
  return escapado.replace(/\x00TAG(\d+)\x00/g, (_, n) => guardadas[Number(n)] || '')
}

function inlineFmt(s: string): string {
  // **bold** e *italic* (após escape HTML básico)
  // Como o markdown pode ter ** dentro de cláusulas, processo greedy mas pareado.
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<![\*])\*([^*]+)\*(?![\*])/g, '<em>$1</em>')
}

function mdToHtml(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let pBuffer: string[] = []
  let inList = false
  let inTable = false
  let tableHeader: string[] = []
  let tableSep = false
  let tableRows: string[][] = []

  const flushP = () => {
    if (pBuffer.length === 0) return
    const text = pBuffer.join(' ').trim()
    if (text) out.push(`<p>${inlineFmt(escapeHtmlPreservandoTags(text))}</p>`)
    pBuffer = []
  }
  const flushList = () => {
    if (inList) { out.push('</ul>'); inList = false }
  }
  const flushTable = () => {
    if (!inTable) return
    out.push('<table>')
    if (tableHeader.length) {
      out.push('<thead><tr>')
      for (const h of tableHeader) out.push(`<th>${inlineFmt(escapeHtmlPreservandoTags(h.trim()))}</th>`)
      out.push('</tr></thead>')
    }
    if (tableRows.length) {
      out.push('<tbody>')
      for (const row of tableRows) {
        out.push('<tr>')
        for (const cell of row) out.push(`<td>${inlineFmt(escapeHtmlPreservandoTags(cell.trim()))}</td>`)
        out.push('</tr>')
      }
      out.push('</tbody>')
    }
    out.push('</table>')
    inTable = false
    tableHeader = []
    tableSep = false
    tableRows = []
  }

  for (let raw of lines) {
    const line = raw.trimEnd()

    // Tabela markdown: detectar | col | col |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushP(); flushList()
      const cells = line.trim().slice(1, -1).split('|')
      // separador?
      if (cells.every((c) => /^\s*:?-+:?\s*$/.test(c))) {
        tableSep = true
        continue
      }
      if (!inTable) {
        inTable = true
        tableHeader = cells
        continue
      }
      if (tableSep) {
        tableRows.push(cells)
      } else {
        // sem separador, é uma linha de dado mesmo
        tableRows.push(cells)
      }
      continue
    } else if (inTable) {
      flushTable()
    }

    if (!line.trim()) {
      flushP()
      flushList()
      continue
    }
    if (/^---+$/.test(line.trim())) {
      flushP(); flushList()
      out.push('<hr/>')
      continue
    }
    // Headings
    if (line.startsWith('### ')) {
      flushP(); flushList()
      out.push(`<h3>${inlineFmt(escapeHtmlPreservandoTags(line.slice(4)))}</h3>`)
      continue
    }
    if (line.startsWith('## ')) {
      flushP(); flushList()
      out.push(`<h2>${inlineFmt(escapeHtmlPreservandoTags(line.slice(3)))}</h2>`)
      continue
    }
    if (line.startsWith('# ')) {
      flushP(); flushList()
      out.push(`<h1>${inlineFmt(escapeHtmlPreservandoTags(line.slice(2)))}</h1>`)
      continue
    }
    // Lista
    if (/^[-*]\s+/.test(line.trim())) {
      flushP()
      if (!inList) { out.push('<ul>'); inList = true }
      out.push(`<li>${inlineFmt(escapeHtmlPreservandoTags(line.trim().replace(/^[-*]\s+/, '')))}</li>`)
      continue
    }
    // Linha de assinatura ___________
    if (/^_{3,}/.test(line.trim())) {
      flushP(); flushList()
      out.push('<div class="sig-line"></div>')
      continue
    }
    // Parágrafo
    if (inList) flushList()
    pBuffer.push(line.trim())
  }
  flushP()
  flushList()
  flushTable()

  let html = out.join('\n')

  // Card "DAS PARTES": h2 vira parties-header e o conteúdo até o próximo hr fica em parties-card
  html = html.replace(
    /<h2>DAS PARTES<\/h2>([\s\S]*?)(<hr\/>)/,
    '<h2 class="parties-header">DAS PARTES</h2><div class="parties-card">$1</div>$2'
  )

  // Cláusulas: h2 com texto começando com "CLÁUSULA N — ..." vira clause-heading com badge
  html = html.replace(
    /<h2>(CL[ÁA]USULA\s+(\d+)[ªa]?\s*[—–-]\s*([^<]+))<\/h2>/g,
    '<h2 class="clause-heading"><span class="clause-num">$2</span><span class="clause-title">$3</span></h2>'
  )

  // Marca placeholders {{x.y}} restantes em amarelo
  html = html.replace(
    /(\{\{[^}]+\}\})/g,
    '<span class="placeholder">$1</span>'
  )

  return html
}

// Renderiza o HTML+CSS num iframe oculto, captura via html2canvas e
// monta PDF base64 (multi-página). Usado pra enviar ao ZapSign.
export async function gerarPdfBase64FromMd(markdown: string, _numero?: string): Promise<string> {
  const html2canvas = (await import('html2canvas')).default
  const jsPDF = (await import('jspdf')).default

  const bodyHtml = mdToHtml(markdown)
  const fullHtml = `${UTF8_BOM}<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><style>${contratoCss}</style></head><body><div class="content">${bodyHtml}</div></body></html>`

  // Cria iframe escondido
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.left = '-99999px'
  iframe.style.top = '0'
  iframe.style.width = '794px'  // A4 a 96dpi
  iframe.style.height = '1123px'
  iframe.style.border = 'none'
  document.body.appendChild(iframe)

  try {
    const doc = iframe.contentDocument!
    doc.open()
    doc.write(fullHtml)
    doc.close()

    // Aguarda o conteúdo renderizar
    await new Promise((r) => setTimeout(r, 500))
    if (doc.fonts && doc.fonts.ready) await doc.fonts.ready

    const target = doc.querySelector('.content') as HTMLElement || doc.body
    const canvas = await html2canvas(target, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      windowWidth: 794,
    })

    // Monta PDF A4 (210x297mm) multi-página
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    const pdfWidth = 210
    const pdfHeight = 297
    const imgHeight = (canvas.height * pdfWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight)
    heightLeft -= pdfHeight
    while (heightLeft > 0) {
      position = -((imgHeight - heightLeft))
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight)
      heightLeft -= pdfHeight
    }

    const dataUri = pdf.output('datauristring')
    return dataUri.split(',')[1]
  } finally {
    document.body.removeChild(iframe)
  }
}

export function printContratoFromMd(markdown: string, numero?: string) {
  const bodyHtml = mdToHtml(markdown)
  const titulo = `Contrato ${numero || ''}`.trim()

  const fullHtml = `${UTF8_BOM}<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${escapeHtml(titulo)}</title>
<style>${contratoCss}</style>
</head>
<body>
<div class="content">
${bodyHtml}
</div>
<script>
window.addEventListener('load', () => {
  setTimeout(() => { window.print(); }, 300);
});
</script>
</body>
</html>`

  // Cria Blob URL com o HTML completo. Isso funciona melhor que
  // document.write em janelas modernas (Edge/Chrome bloqueiam write em about:blank).
  // Prefix BOM garantido + MIME com charset = pipeline UTF-8 100%.
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank', 'width=900,height=1200')
  if (!w) {
    alert('Bloqueio de pop-up. Permita pop-ups nesse site pra gerar o PDF.')
    URL.revokeObjectURL(url)
    return
  }
  // Revogar a URL depois de carregar (não logo, senão a janela perde a referência)
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
