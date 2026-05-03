import { fmtData, MORADDA_DADOS } from './contratos'
import contratoCss from './contratoStyle.css?raw'
import { ESTADO_LABEL, isAvariado, type VistoriaItemEstado } from './vistorias'

const UTF8_BOM = '﻿'

function escapeHtml(s: string | null | undefined): string {
  if (!s) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function nl2br(s: string | null | undefined): string {
  return escapeHtml(s).replace(/\n/g, '<br/>')
}

function clauseHeading(num: number, titulo: string): string {
  return `<h2 class="clause-heading"><span class="clause-num">${num}</span><span class="clause-title">${escapeHtml(titulo)}</span></h2>`
}

export interface VistoriaPdfItem {
  comodo: string
  item: string
  estado: VistoriaItemEstado | string
  observacoes?: string | null
  fotos?: string[] | null
}

export interface VistoriaPdfData {
  numero?: string | null
  tipo: 'entrada' | 'saida'
  realizada_em?: string | null
  estado_geral?: string | null
  observacoes?: string | null
  imovel: {
    codigo?: string | null
    titulo?: string | null
    endereco?: string | null
    numero?: string | null
    complemento?: string | null
    bairro_nome?: string | null
    cidade?: string | null
    estado?: string | null
    cep?: string | null
    matricula?: string | null
  }
  locador?: {
    nome?: string | null
    cpf?: string | null
  } | null
  locatario?: {
    nome?: string | null
    cpf?: string | null
  } | null
  responsavel_nome?: string | null
  contrato_numero?: string | null
  itens: VistoriaPdfItem[]
}

function enderecoImovel(im: VistoriaPdfData['imovel']): string {
  const parts: string[] = []
  if (im.endereco) parts.push(im.endereco + (im.numero ? `, ${im.numero}` : ''))
  if (im.complemento) parts.push(im.complemento)
  if (im.bairro_nome) parts.push(im.bairro_nome)
  if (im.cidade && im.estado) parts.push(`${im.cidade}/${im.estado}`)
  else if (im.cidade) parts.push(im.cidade)
  if (im.cep) parts.push(`CEP ${im.cep}`)
  return parts.filter(Boolean).join(' · ')
}

function estadoBadge(estado: string): string {
  const label = ESTADO_LABEL[estado as VistoriaItemEstado] || estado
  let bg = '#e3e8ee', color = '#1a3a5c', border = '#1a3a5c'
  switch (estado) {
    case 'otimo':    bg = '#d1fae5'; color = '#065f46'; border = '#10b981'; break
    case 'bom':      bg = '#dbeafe'; color = '#1e3a8a'; border = '#2563eb'; break
    case 'regular':  bg = '#fef3c7'; color = '#78350f'; border = '#d97706'; break
    case 'ruim':     bg = '#ffedd5'; color = '#7c2d12'; border = '#ea580c'; break
    case 'avariado': bg = '#fee2e2'; color = '#7f1d1d'; border = '#dc2626'; break
  }
  return `<span style="display:inline-block;padding:1pt 6pt;border-radius:3pt;background:${bg};color:${color};border:0.6pt solid ${border};font-size:9pt;font-weight:bold;text-transform:uppercase;letter-spacing:0.4px;">${escapeHtml(label)}</span>`
}

function buildBody(v: VistoriaPdfData): string {
  const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const cidade = (MORADDA_DADOS as any)?.cidade || 'Resende'
  const estado = (MORADDA_DADOS as any)?.estado || 'RJ'
  const moraddaNome = (MORADDA_DADOS as any)?.nome || 'Moradda Imobiliária'
  const moraddaCnpj = (MORADDA_DADOS as any)?.cpf_cnpj
  const moraddaCreci = (MORADDA_DADOS as any)?.creci

  const tipoLabel = v.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA'
  const imovelLinha = enderecoImovel(v.imovel)

  // Agrupa itens por cômodo
  const grupos = new Map<string, VistoriaPdfItem[]>()
  for (const it of v.itens || []) {
    const key = it.comodo || 'Outros'
    if (!grupos.has(key)) grupos.set(key, [])
    grupos.get(key)!.push(it)
  }

  const avariados = (v.itens || []).filter((it) => isAvariado(it.estado))

  let n = 1

  let checklistHtml = ''
  for (const [comodo, items] of grupos.entries()) {
    checklistHtml += `<h3>${escapeHtml(comodo)}</h3>`
    checklistHtml += `<table>
<thead>
  <tr>
    <th style="width:34%">Item</th>
    <th style="width:14%">Estado</th>
    <th style="width:52%;text-align:left">Observações / Fotos</th>
  </tr>
</thead>
<tbody>`
    for (const it of items) {
      const obs = nl2br(it.observacoes)
      const fotos = (it.fotos || []).slice(0, 4)
      const fotosHtml = fotos.length > 0
        ? `<div style="margin-top:3pt;display:flex;gap:3pt;flex-wrap:wrap;">` +
          fotos.map((u) => `<img src="${escapeHtml(u)}" style="width:32mm;height:24mm;object-fit:cover;border:0.5pt solid #c9a961;border-radius:2pt;" />`).join('') +
          `</div>`
        : ''
      const rowBg = isAvariado(it.estado) ? ' style="background:#fee2e2 !important;"' : ''
      checklistHtml += `
  <tr${rowBg}>
    <td style="text-align:left;font-weight:normal;color:#2c3e50;">${escapeHtml(it.item || '—')}</td>
    <td>${estadoBadge(String(it.estado))}</td>
    <td style="text-align:left;font-weight:normal;color:#2c3e50;font-size:9.5pt;">
      ${obs || '<span style="color:#888;">—</span>'}
      ${fotosHtml}
    </td>
  </tr>`
    }
    checklistHtml += `</tbody></table>`
  }

  const partesHtml = (v.locador?.nome || v.locatario?.nome) ? `
<h2 class="parties-header">PARTES IDENTIFICADAS</h2>
<div class="parties-card">
  ${v.locador?.nome ? `<p><strong>Locador:</strong> ${escapeHtml(v.locador.nome)}${v.locador.cpf ? ` · CPF/CNPJ ${escapeHtml(v.locador.cpf)}` : ''}.</p>` : ''}
  ${v.locatario?.nome ? `<p><strong>Locatário:</strong> ${escapeHtml(v.locatario.nome)}${v.locatario.cpf ? ` · CPF/CNPJ ${escapeHtml(v.locatario.cpf)}` : ''}.</p>` : ''}
  ${v.contrato_numero ? `<p>Contrato vinculado: <strong>${escapeHtml(v.contrato_numero)}</strong></p>` : '<p style="color:#666;font-style:italic;">Vistoria avulsa (sem contrato vinculado).</p>'}
</div>
` : ''

  const avariadosHtml = avariados.length > 0 ? `
${clauseHeading(n++, 'Itens com Avarias / Pendências')}
<div class="alert-warning">
  <strong>Atenção:</strong> os itens listados abaixo foram identificados como <strong>avariado</strong> ou <strong>ruim</strong> e podem demandar reparo, reposição ou ajuste financeiro.
</div>
<table>
<thead>
  <tr>
    <th style="width:22%">Cômodo</th>
    <th style="width:32%">Item</th>
    <th style="width:14%">Estado</th>
    <th style="width:32%;text-align:left">Observações</th>
  </tr>
</thead>
<tbody>
${avariados.map((it) => `
  <tr style="background:#fee2e2 !important;">
    <td style="text-align:left;font-weight:normal;">${escapeHtml(it.comodo)}</td>
    <td style="text-align:left;font-weight:normal;">${escapeHtml(it.item)}</td>
    <td>${estadoBadge(String(it.estado))}</td>
    <td style="text-align:left;font-weight:normal;color:#2c3e50;font-size:9.5pt;">${nl2br(it.observacoes) || '<span style="color:#888;">—</span>'}</td>
  </tr>`).join('')}
</tbody>
</table>
` : ''

  return `
<h1>Laudo de Vistoria — ${escapeHtml(tipoLabel)}</h1>
<h2>${escapeHtml(v.numero || `${tipoLabel} · ${cidade}`)}</h2>
<p>${escapeHtml(cidade)}, ${escapeHtml(v.realizada_em ? fmtData(v.realizada_em) : dataHoje)}</p>

<h2 class="parties-header">IMÓVEL OBJETO</h2>
<div class="parties-card">
  ${v.imovel.codigo || v.imovel.titulo ? `<p><strong>${escapeHtml(v.imovel.codigo || '')}${v.imovel.codigo && v.imovel.titulo ? ' — ' : ''}${escapeHtml(v.imovel.titulo || '')}</strong></p>` : ''}
  ${imovelLinha ? `<p>${escapeHtml(imovelLinha)}</p>` : ''}
  ${v.imovel.matricula ? `<p>Matrícula: <strong>${escapeHtml(v.imovel.matricula)}</strong></p>` : ''}
</div>

${partesHtml}

${clauseHeading(n++, 'Estado Geral do Imóvel')}
<p>O imóvel acima identificado foi vistoriado por representante da <strong>${escapeHtml(moraddaNome)}</strong> na data de <strong>${escapeHtml(v.realizada_em ? fmtData(v.realizada_em) : dataHoje)}</strong>, sendo constatado o seguinte estado geral: <strong>${escapeHtml(v.estado_geral ? (ESTADO_LABEL[v.estado_geral as VistoriaItemEstado] || v.estado_geral) : '—')}</strong>.</p>
${v.observacoes ? `<p>${nl2br(v.observacoes)}</p>` : ''}

${clauseHeading(n++, 'Checklist por Cômodo')}
<p>Segue abaixo o detalhamento dos itens vistoriados, organizado por cômodo, com indicação do estado de conservação e observações pertinentes:</p>
${checklistHtml || '<p style="color:#666;font-style:italic;">Nenhum item registrado nesta vistoria.</p>'}

${avariadosHtml}

<hr/>

<p>E, por estarem assim justos e acordados quanto ao teor da presente vistoria, firmam o presente laudo para os devidos fins.</p>

<p style="text-align: right; margin-top: 0.6cm;">${escapeHtml(cidade)}/${escapeHtml(estado)}, ${escapeHtml(dataHoje)}.</p>

${v.locador?.nome ? `
<div class="signature-block">
  <div class="sig-line"></div>
  <div class="sig-label">
    <strong>${escapeHtml(v.locador.nome)}</strong>
    ${v.locador.cpf ? `<br/>CPF/CNPJ: ${escapeHtml(v.locador.cpf)}` : ''}
    <br/>Locador
  </div>
</div>` : ''}

${v.locatario?.nome ? `
<div class="signature-block">
  <div class="sig-line"></div>
  <div class="sig-label">
    <strong>${escapeHtml(v.locatario.nome)}</strong>
    ${v.locatario.cpf ? `<br/>CPF/CNPJ: ${escapeHtml(v.locatario.cpf)}` : ''}
    <br/>Locatário
  </div>
</div>` : ''}

<div class="signature-block">
  <div class="sig-line"></div>
  <div class="sig-label">
    <strong>${escapeHtml(v.responsavel_nome || moraddaNome)}</strong>
    ${moraddaCnpj ? `<br/>CNPJ: ${escapeHtml(moraddaCnpj)}` : ''}
    ${moraddaCreci ? `<br/>CRECI: ${escapeHtml(moraddaCreci)}` : ''}
    <br/>Responsável pela Vistoria
  </div>
</div>
`
}

export function printVistoria(data: VistoriaPdfData) {
  const body = buildBody(data)
  const tipoLabel = data.tipo === 'entrada' ? 'Entrada' : 'Saída'
  const titulo = `Vistoria de ${tipoLabel} ${data.numero || ''}`.trim()

  const fullHtml = `${UTF8_BOM}<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${escapeHtml(titulo)}</title>
<style>${contratoCss}</style>
</head>
<body>
<div class="content">
${body}
</div>
<script>
window.addEventListener('load', () => {
  setTimeout(() => { window.print(); }, 400);
});
</script>
</body>
</html>`

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank', 'width=900,height=1200')
  if (!w) {
    alert('Bloqueio de pop-up. Permita pop-ups nesse site pra gerar o PDF.')
    URL.revokeObjectURL(url)
    return
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/**
 * Gera um PDF base64 simples a partir dos dados da vistoria usando apenas jsPDF.
 *
 * Versão minimalista: gera um PDF de texto puro com a estrutura essencial
 * (cabeçalho, imóvel, partes, checklist em tabela). Suficiente como anexo
 * pra ZapSign. A versão "bonita" via printVistoria() é a que o usuário usa
 * pra impressão/download visual no navegador.
 *
 * Nota: html2canvas não está no bundle, então fotos não são embutidas aqui —
 * apenas a contagem é mencionada. Pra incluir fotos no PDF de assinatura,
 * adicionar html2canvas como dependência e trocar essa função por uma
 * baseada em renderização HTML.
 */
export async function gerarPdfBase64Vistoria(data: VistoriaPdfData): Promise<string> {
  let jsPDFCtor: any
  try {
    const mod: any = await import('jspdf')
    jsPDFCtor = mod.jsPDF || mod.default
  } catch {
    throw new Error('jsPDF não disponível no bundle (dependência ausente).')
  }

  const pdf = new jsPDFCtor({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 18
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const tipoLabel = data.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA'

  function ensureSpace(needed: number) {
    if (y + needed > pageHeight - margin) {
      pdf.addPage()
      y = margin
    }
  }

  function writeWrapped(text: string, fontSize = 10, bold = false) {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    pdf.setFontSize(fontSize)
    const lines = pdf.splitTextToSize(text || '', contentWidth)
    for (const line of lines) {
      ensureSpace(fontSize * 0.4 + 1)
      pdf.text(line, margin, y)
      y += fontSize * 0.45 + 1
    }
  }

  // Cabeçalho
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text(`LAUDO DE VISTORIA — ${tipoLabel}`, pageWidth / 2, y + 6, { align: 'center' })
  y += 12
  pdf.setFontSize(11)
  pdf.text(data.numero || '—', pageWidth / 2, y, { align: 'center' })
  y += 6
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(`Realizada em: ${data.realizada_em ? fmtData(data.realizada_em) : '—'}`, pageWidth / 2, y, { align: 'center' })
  y += 8

  // Imóvel
  writeWrapped('IMÓVEL OBJETO', 11, true); y += 1
  if (data.imovel.codigo || data.imovel.titulo) {
    writeWrapped(`${data.imovel.codigo || ''}${data.imovel.codigo && data.imovel.titulo ? ' — ' : ''}${data.imovel.titulo || ''}`, 10, true)
  }
  const endereco = enderecoImovel(data.imovel)
  if (endereco) writeWrapped(endereco, 10)
  if (data.imovel.matricula) writeWrapped(`Matrícula: ${data.imovel.matricula}`, 10)
  y += 3

  // Partes
  if (data.locador?.nome || data.locatario?.nome) {
    writeWrapped('PARTES', 11, true); y += 1
    if (data.locador?.nome) writeWrapped(`Locador: ${data.locador.nome}${data.locador.cpf ? ` · CPF/CNPJ ${data.locador.cpf}` : ''}`, 10)
    if (data.locatario?.nome) writeWrapped(`Locatário: ${data.locatario.nome}${data.locatario.cpf ? ` · CPF/CNPJ ${data.locatario.cpf}` : ''}`, 10)
    if (data.contrato_numero) writeWrapped(`Contrato vinculado: ${data.contrato_numero}`, 10)
    y += 3
  }

  // Estado geral
  writeWrapped('ESTADO GERAL', 11, true); y += 1
  writeWrapped(`Estado: ${data.estado_geral ? (ESTADO_LABEL[data.estado_geral as VistoriaItemEstado] || data.estado_geral) : '—'}`, 10)
  if (data.observacoes) writeWrapped(`Observações: ${data.observacoes}`, 10)
  y += 3

  // Checklist
  writeWrapped('CHECKLIST POR CÔMODO', 11, true); y += 2

  // Agrupa por cômodo
  const grupos = new Map<string, VistoriaPdfItem[]>()
  for (const it of data.itens || []) {
    const key = it.comodo || 'Outros'
    if (!grupos.has(key)) grupos.set(key, [])
    grupos.get(key)!.push(it)
  }

  for (const [comodo, items] of grupos.entries()) {
    ensureSpace(8)
    writeWrapped(comodo, 10, true)
    for (const it of items) {
      ensureSpace(5)
      const estadoTxt = ESTADO_LABEL[it.estado as VistoriaItemEstado] || String(it.estado)
      const fotosCount = (it.fotos || []).length
      const flag = isAvariado(it.estado) ? ' [!]' : ''
      writeWrapped(`  • ${it.item || '—'} — ${estadoTxt}${flag}${fotosCount ? ` (${fotosCount} foto${fotosCount > 1 ? 's' : ''})` : ''}`, 9.5)
      if (it.observacoes) writeWrapped(`    ${it.observacoes}`, 9)
    }
    y += 1
  }

  // Avariados
  const avariados = (data.itens || []).filter((it) => isAvariado(it.estado))
  if (avariados.length > 0) {
    y += 3
    ensureSpace(10)
    writeWrapped('ITENS COM AVARIAS', 11, true); y += 1
    for (const it of avariados) {
      writeWrapped(`• ${it.comodo} · ${it.item} — ${ESTADO_LABEL[it.estado as VistoriaItemEstado] || it.estado}`, 9.5)
      if (it.observacoes) writeWrapped(`  ${it.observacoes}`, 9)
    }
  }

  // Assinaturas
  y += 8
  ensureSpace(50)
  if (data.locador?.nome) {
    pdf.setDrawColor(120)
    pdf.line(margin, y, margin + 80, y)
    y += 4
    writeWrapped(`${data.locador.nome}${data.locador.cpf ? ` — CPF: ${data.locador.cpf}` : ''}`, 9)
    writeWrapped('Locador', 9)
    y += 6
  }
  if (data.locatario?.nome) {
    ensureSpace(20)
    pdf.line(margin, y, margin + 80, y)
    y += 4
    writeWrapped(`${data.locatario.nome}${data.locatario.cpf ? ` — CPF: ${data.locatario.cpf}` : ''}`, 9)
    writeWrapped('Locatário', 9)
    y += 6
  }
  ensureSpace(20)
  pdf.line(margin, y, margin + 80, y)
  y += 4
  writeWrapped(data.responsavel_nome || (MORADDA_DADOS as any)?.nome || 'Moradda Imobiliária', 9)
  writeWrapped('Responsável pela Vistoria', 9)

  const dataUri = pdf.output('datauristring') as string
  const base64 = dataUri.split(',')[1] || ''
  return base64
}
