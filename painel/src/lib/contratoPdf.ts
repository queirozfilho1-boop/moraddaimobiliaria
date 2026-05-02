import jsPDF from 'jspdf'
import type { ContratoLocacao, ContratoParte } from './contratos'
import {
  TIPO_LABEL, GARANTIA_LABEL, INDICE_LABEL,
  fmtMoeda, fmtData,
} from './contratos'

interface Imovel {
  id: string
  codigo?: string | null
  titulo?: string | null
  preco?: number | null
}

interface Args {
  contrato: ContratoLocacao | Partial<ContratoLocacao>
  partes: ContratoParte[] | Array<Omit<ContratoParte, 'id' | 'contrato_id'>>
  imovel: Imovel
}

const LH = 5.5 // line height mm

function p(doc: jsPDF, text: string, x: number, y: number, opts: { maxW?: number; align?: 'left' | 'center' | 'right'; bold?: boolean; size?: number } = {}) {
  if (opts.bold) doc.setFont('helvetica', 'bold')
  else doc.setFont('helvetica', 'normal')
  if (opts.size) doc.setFontSize(opts.size)
  if (opts.maxW) {
    const lines = doc.splitTextToSize(text, opts.maxW)
    doc.text(lines, x, y, { align: opts.align })
    return y + lines.length * LH
  }
  doc.text(text, x, y, { align: opts.align })
  return y + LH
}

export async function gerarPdfContratoBase64({ contrato, partes, imovel }: Args): Promise<string> {
  const doc = buildPdfDoc({ contrato, partes, imovel })
  // jsPDF datauristring vem como "data:application/pdf;filename=..;base64,XXXX"
  const dataUri = doc.output('datauristring')
  const idx = dataUri.indexOf('base64,')
  return idx >= 0 ? dataUri.substring(idx + 7) : dataUri
}

export async function gerarPdfContrato({ contrato: c, partes, imovel }: Args): Promise<void> {
  const doc = buildPdfDoc({ contrato: c, partes, imovel })
  doc.save(`Contrato_${c.numero?.replace('/', '-') || 'rascunho'}.pdf`)
}

function buildPdfDoc({ contrato: c, partes, imovel }: Args): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const margin = 18
  const maxW = W - margin * 2
  let y = margin

  // ── Header
  doc.setFillColor(20, 50, 80)
  doc.rect(0, 0, W, 18, 'F')
  doc.setTextColor(255, 255, 255)
  y = p(doc, 'MORADDA IMOBILIÁRIA', margin, 11, { bold: true, size: 14 })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('moradda.com.br · contato@moradda.com.br', W - margin, 11, { align: 'right' })

  doc.setTextColor(0, 0, 0)
  y = 26

  // ── Título
  y = p(doc, `CONTRATO DE ${TIPO_LABEL[c.tipo as keyof typeof TIPO_LABEL]?.toUpperCase() || 'LOCAÇÃO'}`,
    W / 2, y, { bold: true, size: 13, align: 'center' })
  if (c.numero) y = p(doc, `Nº ${c.numero}`, W / 2, y, { size: 10, align: 'center' })
  y += 4

  // ── Partes
  const locadores = partes.filter((x: any) => x.papel === 'locador')
  const locatarios = partes.filter((x: any) => x.papel === 'locatario')
  const fiadores = partes.filter((x: any) => x.papel === 'fiador')

  doc.setFontSize(10)
  for (const l of locadores) {
    y = p(doc, 'LOCADOR(A):', margin, y, { bold: true, size: 10 })
    y = p(doc, descreverParte(l), margin, y, { maxW, size: 9 })
    y += 2
  }
  for (const l of locatarios) {
    y = p(doc, 'LOCATÁRIO(A):', margin, y, { bold: true, size: 10 })
    y = p(doc, descreverParte(l), margin, y, { maxW, size: 9 })
    y += 2
  }
  for (const l of fiadores) {
    y = p(doc, 'FIADOR(A):', margin, y, { bold: true, size: 10 })
    y = p(doc, descreverParte(l), margin, y, { maxW, size: 9 })
    y += 2
  }
  y += 3

  // ── Cláusulas
  y = clause(doc, '1. OBJETO',
    `O LOCADOR cede em locação ao LOCATÁRIO o imóvel ${imovel.codigo ? `código ${imovel.codigo}` : ''}, ` +
    `${imovel.titulo || 'descrito no cadastro da Moradda Imobiliária'}, conforme caracterização do anexo.`,
    margin, y, maxW)

  y = clause(doc, '2. PRAZO',
    `A locação tem prazo de ${c.prazo_meses || '—'} meses, com início em ${fmtData(c.data_inicio)} ` +
    `e término em ${fmtData(c.data_fim)}.`,
    margin, y, maxW)

  const valoresLista: string[] = []
  if (c.valor_aluguel) valoresLista.push(`aluguel mensal de ${fmtMoeda(c.valor_aluguel)}`)
  if (c.valor_condominio) valoresLista.push(`condomínio de ${fmtMoeda(c.valor_condominio)}`)
  if (c.valor_iptu) valoresLista.push(`IPTU de ${fmtMoeda(c.valor_iptu)}`)
  if (c.valor_outros) valoresLista.push(`outras despesas de ${fmtMoeda(c.valor_outros)}`)
  y = clause(doc, '3. VALOR E PAGAMENTO',
    `O LOCATÁRIO pagará ${valoresLista.join(', ')}, com vencimento todo dia ${c.dia_vencimento || 5} de cada mês. ` +
    `A taxa de administração é de ${c.taxa_admin_pct || 0}% sobre o valor do aluguel.`,
    margin, y, maxW)

  y = clause(doc, '4. REAJUSTE',
    c.indice_reajuste === 'sem_reajuste'
      ? 'O contrato não prevê reajuste anual de valores.'
      : `Os valores serão reajustados anualmente pelo índice ${INDICE_LABEL[c.indice_reajuste as keyof typeof INDICE_LABEL] || 'IGPM'}.`,
    margin, y, maxW)

  y = clause(doc, '5. GARANTIA',
    c.garantia_tipo === 'sem_garantia'
      ? 'A locação dispensa garantia.'
      : `A garantia da locação é por ${GARANTIA_LABEL[c.garantia_tipo as keyof typeof GARANTIA_LABEL] || ''}` +
        (c.garantia_valor ? `, no valor de ${fmtMoeda(c.garantia_valor)}` : '') +
        (c.garantia_observacoes ? `. ${c.garantia_observacoes}` : '.'),
    margin, y, maxW)

  y = clause(doc, '6. MULTA E JUROS',
    `Em caso de atraso, multa de ${c.multa_atraso_pct || 2}% sobre o valor devido e juros de mora de ${c.juros_dia_pct || 0.033}% ao dia. ` +
    `A rescisão antecipada implica multa equivalente a ${c.multa_rescisao_meses || 3} meses de aluguel, proporcional ao prazo restante.`,
    margin, y, maxW)

  if (c.observacoes) {
    y = clause(doc, '7. OBSERVAÇÕES', String(c.observacoes), margin, y, maxW)
  }

  y = clause(doc, '8. FORO',
    'Fica eleito o foro da comarca do imóvel locado para dirimir quaisquer questões oriundas deste contrato.',
    margin, y, maxW)

  // ── Espaço para assinaturas
  if (y > H - 60) { doc.addPage(); y = margin }
  y += 10
  y = p(doc, `Local e data: _________________________________________________`, margin, y, { size: 10 })
  y += 12

  const sigW = (maxW - 10) / 2
  for (const l of locadores) {
    y = signatureLine(doc, l.nome, 'LOCADOR', margin, y, sigW)
  }
  y += 4
  for (const l of locatarios) {
    y = signatureLine(doc, l.nome, 'LOCATÁRIO', margin, y, sigW)
  }
  if (fiadores.length) {
    y += 4
    for (const l of fiadores) {
      y = signatureLine(doc, l.nome, 'FIADOR', margin, y, sigW)
    }
  }

  // Footer
  const totalPages = (doc.internal as any).getNumberOfPages?.() || 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(120)
    doc.text(
      `Moradda Imobiliária · ${c.numero || 'Contrato'} · Página ${i} de ${totalPages}`,
      W / 2, H - 8, { align: 'center' }
    )
  }

  return doc
}

function descreverParte(p: any): string {
  const partes: string[] = []
  partes.push(p.nome)
  if (p.nacionalidade) partes.push(p.nacionalidade.toLowerCase())
  if (p.estado_civil) partes.push(p.estado_civil.toLowerCase())
  if (p.profissao) partes.push(p.profissao.toLowerCase())
  const docs: string[] = []
  if (p.cpf_cnpj) docs.push(`CPF/CNPJ ${p.cpf_cnpj}`)
  if (p.rg) docs.push(`RG ${p.rg}`)
  if (docs.length) partes.push('portador(a) de ' + docs.join(' e '))
  if (p.endereco) {
    let end = `residente e domiciliado(a) em ${p.endereco}`
    if (p.numero) end += `, ${p.numero}`
    if (p.complemento) end += `, ${p.complemento}`
    if (p.bairro) end += `, ${p.bairro}`
    if (p.cidade) end += `, ${p.cidade}`
    if (p.estado) end += `/${p.estado}`
    partes.push(end)
  }
  return partes.filter(Boolean).join(', ') + '.'
}

function clause(doc: jsPDF, titulo: string, texto: string, x: number, y: number, maxW: number): number {
  // page break
  if (y > 260) { doc.addPage(); y = 18 }
  y = p(doc, titulo, x, y, { bold: true, size: 10 })
  y = p(doc, texto, x, y, { size: 10, maxW })
  return y + 3
}

function signatureLine(doc: jsPDF, nome: string, papel: string, x: number, y: number, w: number): number {
  doc.setLineWidth(0.3)
  doc.line(x, y, x + w, y)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(nome || '_____________________', x, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(papel, x, y + 9)
  return y + 14
}
