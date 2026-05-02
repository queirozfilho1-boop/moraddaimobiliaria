// Gera Informe de Rendimentos anual em PDF pra cada proprietário
// Útil pra IRPF do dono do imóvel.

import jsPDF from 'jspdf'
import { fmtMoeda } from './contratos'

interface Repasse {
  data_referencia: string
  valor_bruto: number
  taxa_admin: number
  valor_repasse: number
  contratos_locacao?: { numero?: string | null; imoveis?: { codigo?: string | null; titulo?: string | null } | null } | null
}

interface Proprietario {
  id: string
  nome: string
  cpf_cnpj?: string | null
  endereco?: string | null
}

export function gerarInformeIR(proprietario: Proprietario, ano: number, repasses: Repasse[], moraddaCnpj = ''): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const margin = 18

  // Header
  doc.setFillColor(20, 50, 80)
  doc.rect(0, 0, W, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('MORADDA IMOBILIÁRIA', margin, 11)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  doc.text(`Informe de Rendimentos · ${ano}`, W - margin, 11, { align: 'right' })

  doc.setTextColor(0, 0, 0)
  let y = 30

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.text('INFORME DE RENDIMENTOS DE LOCAÇÃO', W / 2, y, { align: 'center' })
  y += 6
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.text(`Ano-calendário ${ano}`, W / 2, y, { align: 'center' })
  y += 10

  // Dados do beneficiário
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.text('BENEFICIÁRIO', margin, y); y += 5
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.text(`Nome: ${proprietario.nome}`, margin, y); y += 4
  doc.text(`CPF/CNPJ: ${proprietario.cpf_cnpj || '—'}`, margin, y); y += 4
  if (proprietario.endereco) { doc.text(`Endereço: ${proprietario.endereco}`, margin, y); y += 4 }
  y += 4

  // Fonte pagadora
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.text('FONTE PAGADORA (ADMINISTRADORA)', margin, y); y += 5
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.text('Moradda Imobiliária', margin, y); y += 4
  if (moraddaCnpj) { doc.text(`CNPJ: ${moraddaCnpj}`, margin, y); y += 4 }
  y += 4

  // Tabela mensal
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.text('RECEBIMENTOS MENSAIS', margin, y); y += 5

  const meses: Record<string, { bruto: number; taxa: number; liquido: number }> = {}
  for (let m = 0; m < 12; m++) {
    const key = String(m + 1).padStart(2, '0')
    meses[key] = { bruto: 0, taxa: 0, liquido: 0 }
  }

  for (const r of repasses) {
    const ref = new Date(r.data_referencia)
    if (ref.getFullYear() !== ano) continue
    const m = String(ref.getMonth() + 1).padStart(2, '0')
    if (!meses[m]) continue
    meses[m].bruto += Number(r.valor_bruto || 0)
    meses[m].taxa += Number(r.taxa_admin || 0)
    meses[m].liquido += Number(r.valor_repasse || 0)
  }

  // Header tabela
  doc.setFontSize(8); doc.setFont('helvetica', 'bold')
  doc.text('Mês', margin + 2, y + 4)
  doc.text('Aluguel Bruto', margin + 50, y + 4, { align: 'right' })
  doc.text('Taxa Admin', margin + 90, y + 4, { align: 'right' })
  doc.text('Líquido Recebido', W - margin - 2, y + 4, { align: 'right' })
  doc.setLineWidth(0.3); doc.line(margin, y + 6, W - margin, y + 6)
  y += 9
  doc.setFont('helvetica', 'normal')

  let totalBruto = 0, totalTaxa = 0, totalLiquido = 0
  const nomeMeses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  for (const [m, v] of Object.entries(meses)) {
    doc.text(`${m}/${ano} · ${nomeMeses[parseInt(m)-1]}`, margin + 2, y)
    doc.text(fmtMoeda(v.bruto), margin + 50, y, { align: 'right' })
    doc.text(fmtMoeda(v.taxa), margin + 90, y, { align: 'right' })
    doc.text(fmtMoeda(v.liquido), W - margin - 2, y, { align: 'right' })
    y += 5
    totalBruto += v.bruto; totalTaxa += v.taxa; totalLiquido += v.liquido
  }

  doc.line(margin, y, W - margin, y); y += 4
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL', margin + 2, y)
  doc.text(fmtMoeda(totalBruto), margin + 50, y, { align: 'right' })
  doc.text(fmtMoeda(totalTaxa), margin + 90, y, { align: 'right' })
  doc.text(fmtMoeda(totalLiquido), W - margin - 2, y, { align: 'right' })
  y += 10

  // Imóveis
  const imoveis = new Set<string>()
  for (const r of repasses) {
    const ref = new Date(r.data_referencia)
    if (ref.getFullYear() !== ano) continue
    const im = r.contratos_locacao?.imoveis
    if (im?.codigo) imoveis.add(`${im.codigo} - ${im.titulo || ''}`)
  }
  if (imoveis.size > 0) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
    doc.text('IMÓVEIS', margin, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    for (const im of imoveis) {
      doc.text(`• ${im}`, margin + 2, y); y += 4
    }
    y += 4
  }

  // Observações IR
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  const txt = `Os valores acima foram efetivamente pagos a você no ano-calendário ${ano} ` +
    `e devem ser declarados na Ficha "Rendimentos Tributáveis Recebidos de PJ" (se você for PF) ou no ` +
    `regime de competência da PJ. A dedução da taxa de administração pode ser feita conforme legislação vigente. ` +
    `Em caso de dúvida, consulte um contador.`
  const lines = doc.splitTextToSize(txt, W - margin * 2)
  doc.text(lines, margin, y)

  // Footer
  const H = doc.internal.pageSize.getHeight()
  doc.setTextColor(150, 150, 150); doc.setFontSize(7)
  doc.text(
    `Gerado por Moradda Imobiliária em ${new Date().toLocaleString('pt-BR')}`,
    W / 2, H - 8, { align: 'center' }
  )

  doc.save(`Informe_IR_${ano}_${proprietario.nome.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
}
