import { jsPDF } from 'jspdf'
import assinaturaUrl from '@/assets/assinatura.png'

interface PtamData {
  bairroNome: string
  tipo: string
  tipoLabel: string
  area: number
  quartos: number
  suites: number
  vagas: number
  idade: number
  extras: string[]
  minValue: number
  maxValue: number
  avgValue: number
  pricePerM2: number
  similarCount: number
  confidence: 'alta' | 'media' | 'baixa'
  adjustments: {
    base: number
    quartos: number
    suites: number
    vagas: number
    idade: number
    extras: number
  }
  fotos: string[] // base64 data URLs
}

const BLUE = '#1B4F8A'
const GOLD = '#C5A55A'
const DARK = '#333333'
const MED = '#666666'
const LIGHT = '#999999'
const MARGIN = 25
const PAGE_W = 210
const PAGE_H = 297
const CONTENT_W = PAGE_W - MARGIN * 2

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmt(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtPct(value: number): string {
  const pct = (value - 1) * 100
  if (pct > 0) return `+${pct.toFixed(1)}%`
  if (pct < 0) return `${pct.toFixed(1)}%`
  return '0%'
}

function dataExtenso(): string {
  const d = new Date()
  return `Resende/RJ, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const y = PAGE_H - 22
  doc.setDrawColor(GOLD)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)

  doc.setFontSize(7)
  doc.setTextColor(MED)
  doc.setFont('Helvetica', 'normal')
  doc.text('PTAM — Parecer Técnico de Avaliação Mercadológica', MARGIN, y + 4)
  doc.text('Moradda Imobiliária — CRECI-RJ 10404', MARGIN, y + 8)
  doc.text('Rua Dom Bosco, nº 165 — Paraíso, Resende/RJ | (24) 99857-1528', MARGIN, y + 12)
  doc.text('contato@moraddaimobiliaria.com.br | Grupo Alfacon', MARGIN, y + 16)
  doc.text(`Página ${pageNum}/${totalPages}`, PAGE_W - MARGIN, y + 4, { align: 'right' })
}

function sectionHeader(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(27, 79, 138)
  doc.rect(MARGIN, y - 6, CONTENT_W, 9, 'F')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.setFont('Helvetica', 'bold')
  doc.text(title, MARGIN + 4, y)
  return y + 10
}

export function gerarPTAM(data: PtamData) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const totalPages = data.fotos.length > 0 ? 6 : 5

  // ═══════════════════════════════════════════════════════
  // PÁGINA 1 — CAPA
  // ═══════════════════════════════════════════════════════
  doc.setFillColor(27, 79, 138)
  doc.rect(0, 0, PAGE_W, 6, 'F')

  doc.setDrawColor(GOLD)
  doc.setLineWidth(1.5)
  doc.line(MARGIN, 55, PAGE_W - MARGIN, 55)

  doc.setFontSize(36)
  doc.setTextColor(BLUE)
  doc.setFont('Helvetica', 'bold')
  doc.text('MORADDA', PAGE_W / 2, 80, { align: 'center' })

  doc.setFontSize(16)
  doc.setTextColor(DARK)
  doc.setFont('Helvetica', 'normal')
  doc.text('IMOBILIÁRIA', PAGE_W / 2, 90, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(GOLD)
  doc.text('CRECI-RJ 10404', PAGE_W / 2, 100, { align: 'center' })

  doc.setDrawColor(GOLD)
  doc.setLineWidth(0.8)
  doc.line(MARGIN + 40, 110, PAGE_W - MARGIN - 40, 110)

  doc.setFontSize(32)
  doc.setTextColor(BLUE)
  doc.setFont('Helvetica', 'bold')
  doc.text('PTAM', PAGE_W / 2, 140, { align: 'center' })

  doc.setFontSize(14)
  doc.setTextColor(DARK)
  doc.setFont('Helvetica', 'normal')
  doc.text('PARECER TÉCNICO DE', PAGE_W / 2, 152, { align: 'center' })
  doc.text('AVALIAÇÃO MERCADOLÓGICA', PAGE_W / 2, 162, { align: 'center' })

  doc.setDrawColor(GOLD)
  doc.setLineWidth(1.5)
  doc.line(MARGIN, 175, PAGE_W - MARGIN, 175)

  doc.setFontSize(11)
  doc.setTextColor(MED)
  doc.text(`${data.tipoLabel} — ${data.bairroNome}, Resende/RJ`, PAGE_W / 2, 190, { align: 'center' })
  doc.text(`Área: ${data.area} m²`, PAGE_W / 2, 198, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(LIGHT)
  doc.text(dataExtenso(), PAGE_W / 2, 215, { align: 'center' })

  addFooter(doc, 1, totalPages)

  // ═══════════════════════════════════════════════════════
  // PÁGINA 2 — DADOS DO IMÓVEL
  // ═══════════════════════════════════════════════════════
  doc.addPage()
  let y = 30
  y = sectionHeader(doc, '1. DADOS DO IMÓVEL', y)

  const rows: [string, string][] = [
    ['Localização', `${data.bairroNome}, Resende — RJ`],
    ['Tipo do Imóvel', data.tipoLabel],
    ['Área Construída', `${data.area} m²`],
    ['Quartos', `${data.quartos}`],
    ['Suítes', `${data.suites}`],
    ['Vagas de Garagem', `${data.vagas}`],
    ['Idade Estimada', `${data.idade} anos`],
    ['Características', data.extras.length > 0 ? data.extras.join(', ') : 'Nenhuma informada'],
  ]

  for (let i = 0; i < rows.length; i++) {
    if (i % 2 === 0) {
      doc.setFillColor(245, 247, 250)
      doc.rect(MARGIN, y - 5, CONTENT_W, 10, 'F')
    }
    doc.setFontSize(9)
    doc.setFont('Helvetica', 'bold')
    doc.setTextColor(DARK)
    doc.text(rows[i][0], MARGIN + 4, y)
    doc.setFont('Helvetica', 'normal')
    doc.setTextColor(MED)
    doc.text(rows[i][1], MARGIN + 65, y)
    y += 10
  }

  addFooter(doc, 2, totalPages)

  // ═══════════════════════════════════════════════════════
  // PÁGINA 3 — REGISTRO FOTOGRÁFICO (se tiver fotos)
  // ═══════════════════════════════════════════════════════
  if (data.fotos.length > 0) {
    doc.addPage()
    y = 30
    y = sectionHeader(doc, '2. REGISTRO FOTOGRÁFICO', y)

    const photoW = 75
    const photoH = 56
    const gap = 8
    let col = 0

    for (let i = 0; i < Math.min(data.fotos.length, 6); i++) {
      const px = MARGIN + col * (photoW + gap)
      const py = y

      try {
        doc.addImage(data.fotos[i], 'JPEG', px, py, photoW, photoH)
      } catch {
        doc.setFillColor(240, 240, 240)
        doc.rect(px, py, photoW, photoH, 'F')
        doc.setFontSize(8)
        doc.setTextColor(LIGHT)
        doc.text('Foto indisponível', px + photoW / 2, py + photoH / 2, { align: 'center' })
      }

      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.rect(px, py, photoW, photoH, 'S')

      doc.setFontSize(7)
      doc.setTextColor(LIGHT)
      doc.text(`Foto ${i + 1}`, px + photoW / 2, py + photoH + 4, { align: 'center' })

      col++
      if (col >= 2) {
        col = 0
        y += photoH + 12
      }
    }

    addFooter(doc, 3, totalPages)
  }

  // ═══════════════════════════════════════════════════════
  // PÁGINA 4 — AVALIAÇÃO
  // ═══════════════════════════════════════════════════════
  doc.addPage()
  const avalPage = data.fotos.length > 0 ? 4 : 3
  y = 30
  y = sectionHeader(doc, `${data.fotos.length > 0 ? '3' : '2'}. ESTIMATIVA DE VALOR`, y)

  // Caixa de valor
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(MARGIN, y, CONTENT_W, 40, 3, 3, 'F')
  doc.setDrawColor(GOLD)
  doc.setLineWidth(0.8)
  doc.roundedRect(MARGIN, y, CONTENT_W, 40, 3, 3, 'S')

  doc.setFontSize(8)
  doc.setTextColor(LIGHT)
  doc.text('VALOR ESTIMADO', MARGIN + 6, y + 8)

  doc.setFontSize(18)
  doc.setTextColor(BLUE)
  doc.setFont('Helvetica', 'bold')
  doc.text(`${fmt(data.minValue)}  —  ${fmt(data.maxValue)}`, MARGIN + 6, y + 20)

  doc.setFontSize(9)
  doc.setFont('Helvetica', 'normal')
  doc.setTextColor(DARK)
  doc.text(`Valor médio: ${fmt(data.avgValue)}`, MARGIN + 6, y + 30)
  doc.text(`Preço/m²: ${fmt(data.pricePerM2)}/m²`, MARGIN + 80, y + 30)
  doc.text(`Confiança: ${data.confidence === 'alta' ? 'Alta' : data.confidence === 'media' ? 'Média' : 'Baixa'}`, MARGIN + 130, y + 30)
  doc.text(`Imóveis similares: ${data.similarCount}`, MARGIN + 6, y + 36)

  y += 50
  y = sectionHeader(doc, `${data.fotos.length > 0 ? '3' : '2'}.1 FATORES DE AJUSTE`, y)

  // Cabeçalho da tabela
  doc.setFillColor(27, 79, 138)
  doc.rect(MARGIN, y - 5, CONTENT_W, 8, 'F')
  doc.setFontSize(8)
  doc.setFont('Helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('Fator', MARGIN + 4, y)
  doc.text('Ajuste', MARGIN + 85, y)
  doc.text('Impacto', MARGIN + 120, y)
  y += 7

  const adjustRows: [string, string, number][] = [
    [`Preço/m² do bairro (${data.bairroNome})`, `${fmt(data.adjustments.base)}/m²`, 1],
    [`Quartos (${data.quartos})`, fmtPct(data.adjustments.quartos), data.adjustments.quartos],
    [`Suítes (${data.suites})`, fmtPct(data.adjustments.suites), data.adjustments.suites],
    [`Vagas (${data.vagas})`, fmtPct(data.adjustments.vagas), data.adjustments.vagas],
    [`Idade (${data.idade} anos)`, fmtPct(data.adjustments.idade), data.adjustments.idade],
    [`Extras (${data.extras.length} itens)`, fmtPct(data.adjustments.extras), data.adjustments.extras],
  ]

  for (let i = 0; i < adjustRows.length; i++) {
    if (i % 2 === 0) {
      doc.setFillColor(245, 247, 250)
      doc.rect(MARGIN, y - 4, CONTENT_W, 8, 'F')
    }
    doc.setFontSize(8)
    doc.setFont('Helvetica', 'normal')
    doc.setTextColor(DARK)
    doc.text(adjustRows[i][0], MARGIN + 4, y)
    doc.setFont('Helvetica', 'bold')
    doc.text(adjustRows[i][1], MARGIN + 85, y)
    const val = adjustRows[i][2]
    const impact = val > 1 ? 'Valorizou' : val < 1 ? 'Desvalorizou' : 'Base'
    doc.setTextColor(val > 1 ? '#16a34a' : val < 1 ? '#dc2626' : MED)
    doc.text(impact, MARGIN + 120, y)
    y += 8
  }

  addFooter(doc, avalPage, totalPages)

  // ═══════════════════════════════════════════════════════
  // PÁGINA 5 — FUNDAMENTAÇÃO TÉCNICA
  // ═══════════════════════════════════════════════════════
  doc.addPage()
  const fundPage = avalPage + 1
  y = 30
  y = sectionHeader(doc, `${data.fotos.length > 0 ? '4' : '3'}. FUNDAMENTAÇÃO TÉCNICA`, y)

  doc.setFontSize(10)
  doc.setTextColor(BLUE)
  doc.setFont('Helvetica', 'bold')
  doc.text('Metodologia', MARGIN + 4, y)
  y += 6

  doc.setFontSize(8)
  doc.setTextColor(DARK)
  doc.setFont('Helvetica', 'normal')

  const metodo = [
    'Este parecer foi elaborado utilizando o Método Comparativo Direto de Dados de Mercado,',
    'em conformidade com a NBR 14.653 da ABNT — Avaliação de Bens.',
    '',
    'O método consiste na análise comparativa de imóveis similares disponíveis no mercado,',
    'com ajustes baseados nas características específicas do imóvel avaliado.',
  ]
  for (const line of metodo) {
    if (line === '') { y += 3; continue }
    doc.text(line, MARGIN + 4, y); y += 4.5
  }

  y += 6
  doc.setFontSize(10)
  doc.setTextColor(BLUE)
  doc.setFont('Helvetica', 'bold')
  doc.text('Referências de Mercado', MARGIN + 4, y)
  y += 6

  doc.setFontSize(8)
  doc.setTextColor(DARK)
  doc.setFont('Helvetica', 'normal')

  const refs = [
    'Dados coletados a partir de pesquisa de mercado na região de Resende/RJ,',
    'com base em imóveis anunciados em portais imobiliários e análise de mercado local.',
    '',
    'Período de coleta: Abril de 2026',
  ]
  for (const line of refs) {
    if (line === '') { y += 3; continue }
    doc.text(line, MARGIN + 4, y); y += 4.5
  }

  y += 6
  doc.setFontSize(10)
  doc.setTextColor(BLUE)
  doc.setFont('Helvetica', 'bold')
  doc.text('Observações Importantes', MARGIN + 4, y)
  y += 6

  doc.setFontSize(8)
  doc.setTextColor(DARK)
  doc.setFont('Helvetica', 'normal')

  const obs = [
    '• Este parecer tem caráter informativo e não substitui laudo de avaliação formal',
    '  elaborado por engenheiro ou arquiteto.',
    '• Os valores apresentados são estimativas baseadas em dados de mercado vigentes',
    '  na data de emissão.',
    '• Variações de até 15% são esperadas em função de características subjetivas do imóvel.',
    '• Para fins judiciais ou financiamento, recomenda-se laudo elaborado por profissional',
    '  habilitado pelo CREA/CAU.',
  ]
  for (const line of obs) {
    doc.text(line, MARGIN + 4, y); y += 4.5
  }

  addFooter(doc, fundPage, totalPages)

  // ═══════════════════════════════════════════════════════
  // PÁGINA 6 — ASSINATURA
  // ═══════════════════════════════════════════════════════
  doc.addPage()
  const assPage = fundPage + 1
  y = 30
  y = sectionHeader(doc, `${data.fotos.length > 0 ? '5' : '4'}. RESPONSABILIDADE TÉCNICA`, y)

  y += 10

  // Assinatura como imagem
  try {
    const sigW = 50
    const sigH = 50
    doc.addImage(assinaturaUrl, 'PNG', PAGE_W / 2 - sigW / 2, y, sigW, sigH)
    y += sigH + 2
  } catch {
    y += 20
    doc.setDrawColor(DARK)
    doc.setLineWidth(0.3)
    doc.line(PAGE_W / 2 - 40, y, PAGE_W / 2 + 40, y)
    y += 6
  }

  doc.setFontSize(10)
  doc.setTextColor(DARK)
  doc.setFont('Helvetica', 'bold')
  doc.text('Moradda Imobiliária', PAGE_W / 2, y, { align: 'center' })

  y += 5
  doc.setFontSize(9)
  doc.setTextColor(GOLD)
  doc.setFont('Helvetica', 'normal')
  doc.text('CRECI-RJ 10404', PAGE_W / 2, y, { align: 'center' })

  y += 8
  doc.setFontSize(8)
  doc.setTextColor(MED)
  doc.text('Rua Dom Bosco, nº 165 — Paraíso', PAGE_W / 2, y, { align: 'center' })
  y += 4
  doc.text('Resende — RJ, CEP 27541-140', PAGE_W / 2, y, { align: 'center' })
  y += 4
  doc.text('(24) 99857-1528 | contato@moraddaimobiliaria.com.br', PAGE_W / 2, y, { align: 'center' })

  y += 15
  doc.setDrawColor(GOLD)
  doc.setLineWidth(1)
  doc.line(MARGIN + 20, y, PAGE_W - MARGIN - 20, y)

  y += 8
  doc.setFontSize(9)
  doc.setTextColor(BLUE)
  doc.setFont('Helvetica', 'bold')
  doc.text('Grupo Alfacon', PAGE_W / 2, y, { align: 'center' })

  y += 5
  doc.setFontSize(8)
  doc.setTextColor(MED)
  doc.setFont('Helvetica', 'normal')
  doc.text('Solidez e confiança há mais de 10 anos', PAGE_W / 2, y, { align: 'center' })

  y += 5
  doc.text('Moradda Imobiliária | Alfacon Contabilidade', PAGE_W / 2, y, { align: 'center' })

  y += 15
  doc.setFontSize(7)
  doc.setTextColor(LIGHT)
  doc.text(dataExtenso(), PAGE_W / 2, y, { align: 'center' })

  addFooter(doc, assPage, totalPages)

  // ═══════════════════════════════════════════════════════
  // SALVAR
  // ═══════════════════════════════════════════════════════
  const dateStr = new Date().toISOString().slice(0, 10)
  const safeBairro = data.bairroNome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
  const safeTipo = data.tipoLabel.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  doc.save(`PTAM-${safeBairro}-${safeTipo}-${dateStr}.pdf`)
}
