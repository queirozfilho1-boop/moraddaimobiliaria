import { fmtMoeda, fmtData, MORADDA_DADOS } from './contratos'

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

interface PropostaPdfData {
  numero: string
  created_at?: string | null
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
    cartorio?: string | null
  }
  comprador: {
    nome?: string | null
    cpf_cnpj?: string | null
    email?: string | null
    telefone?: string | null
    endereco?: string | null
    cidade?: string | null
    estado?: string | null
  }
  valor: number
  forma_pagamento?: string | null
  condicoes?: string | null
  prazo_resposta?: string | null
  observacoes?: string | null
  contraproposta_valor?: number | null
  contraproposta_obs?: string | null
}

const propostaCss = `
@page { size: A4; margin: 25mm 22mm; }
* { box-sizing: border-box; }
body { font-family: 'Times New Roman', Georgia, serif; color: #1a1a1a; line-height: 1.55; font-size: 12pt; margin: 0; }
.content { max-width: 100%; }
h1 { font-size: 16pt; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0; }
.subtitle { text-align: center; font-size: 11pt; color: #555; margin-bottom: 24px; }
.section { margin-top: 18px; }
.section-title { font-weight: 700; font-size: 11pt; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #1a1a1a; padding-bottom: 3px; margin-bottom: 8px; }
.row { display: grid; grid-template-columns: 180px 1fr; gap: 6px 14px; margin: 3px 0; }
.label { font-weight: 600; color: #444; }
.value { color: #1a1a1a; }
.valor-destaque { font-size: 18pt; font-weight: 700; color: #0a4a8f; text-align: center; padding: 14px; background: #f4f8fc; border: 2px solid #0a4a8f; border-radius: 8px; margin: 14px 0; }
.text-block { white-space: pre-wrap; font-size: 11pt; padding: 8px 10px; background: #fafafa; border-left: 3px solid #ccc; margin: 6px 0; }
.assinaturas { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
.assinatura { text-align: center; }
.assinatura .linha { border-top: 1px solid #1a1a1a; margin-top: 50px; padding-top: 6px; font-size: 10pt; }
.assinatura .nome { font-weight: 700; }
.assinatura .doc { color: #555; font-size: 9pt; margin-top: 2px; }
.cidade-data { text-align: right; margin-top: 36px; font-size: 11pt; }
.contra { background: #fffbeb; border: 1px solid #f59e0b; border-radius: 6px; padding: 10px 14px; margin: 12px 0; }
.contra-title { font-weight: 700; color: #92400e; margin-bottom: 4px; }
.numero-doc { text-align: right; font-family: 'Courier New', monospace; font-size: 10pt; color: #555; margin-bottom: 8px; }
@media print {
  body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
`

function enderecoImovel(im: PropostaPdfData['imovel']): string {
  const parts: string[] = []
  if (im.endereco) parts.push(im.endereco + (im.numero ? `, ${im.numero}` : ''))
  if (im.complemento) parts.push(im.complemento)
  if (im.bairro_nome) parts.push(im.bairro_nome)
  if (im.cidade && im.estado) parts.push(`${im.cidade}/${im.estado}`)
  else if (im.cidade) parts.push(im.cidade)
  if (im.cep) parts.push(`CEP ${im.cep}`)
  return parts.filter(Boolean).join(' · ')
}

function buildBody(p: PropostaPdfData): string {
  const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const cidade = MORADDA_DADOS?.cidade || 'Resende'
  const estado = MORADDA_DADOS?.estado || 'RJ'

  return `
<div class="numero-doc">${escapeHtml(p.numero)}</div>
<h1>Proposta de Compra</h1>
<div class="subtitle">${escapeHtml(p.numero)} · ${escapeHtml(dataHoje)}</div>

<div class="section">
  <div class="section-title">Imóvel</div>
  ${p.imovel.codigo ? `<div class="row"><div class="label">Código</div><div class="value">${escapeHtml(p.imovel.codigo)}</div></div>` : ''}
  ${p.imovel.titulo ? `<div class="row"><div class="label">Descrição</div><div class="value">${escapeHtml(p.imovel.titulo)}</div></div>` : ''}
  <div class="row"><div class="label">Endereço</div><div class="value">${escapeHtml(enderecoImovel(p.imovel)) || '—'}</div></div>
  ${p.imovel.matricula ? `<div class="row"><div class="label">Matrícula</div><div class="value">${escapeHtml(p.imovel.matricula)}${p.imovel.cartorio ? ' · ' + escapeHtml(p.imovel.cartorio) : ''}</div></div>` : ''}
</div>

<div class="section">
  <div class="section-title">Comprador / Proponente</div>
  <div class="row"><div class="label">Nome</div><div class="value">${escapeHtml(p.comprador.nome) || '—'}</div></div>
  ${p.comprador.cpf_cnpj ? `<div class="row"><div class="label">CPF/CNPJ</div><div class="value">${escapeHtml(p.comprador.cpf_cnpj)}</div></div>` : ''}
  ${p.comprador.email ? `<div class="row"><div class="label">E-mail</div><div class="value">${escapeHtml(p.comprador.email)}</div></div>` : ''}
  ${p.comprador.telefone ? `<div class="row"><div class="label">Telefone</div><div class="value">${escapeHtml(p.comprador.telefone)}</div></div>` : ''}
  ${p.comprador.endereco ? `<div class="row"><div class="label">Endereço</div><div class="value">${escapeHtml(p.comprador.endereco)}${p.comprador.cidade ? ' — ' + escapeHtml(p.comprador.cidade) : ''}${p.comprador.estado ? '/' + escapeHtml(p.comprador.estado) : ''}</div></div>` : ''}
</div>

<div class="section">
  <div class="section-title">Valor Proposto</div>
  <div class="valor-destaque">${escapeHtml(fmtMoeda(p.valor))}</div>
  ${p.forma_pagamento ? `<div class="row"><div class="label">Forma de pagamento</div><div class="value">${nl2br(p.forma_pagamento)}</div></div>` : ''}
  ${p.prazo_resposta ? `<div class="row"><div class="label">Prazo para resposta</div><div class="value">${escapeHtml(fmtData(p.prazo_resposta))}</div></div>` : ''}
</div>

${p.condicoes ? `
<div class="section">
  <div class="section-title">Condições</div>
  <div class="text-block">${nl2br(p.condicoes)}</div>
</div>` : ''}

${p.contraproposta_valor ? `
<div class="contra">
  <div class="contra-title">Contraproposta do Vendedor</div>
  <div><strong>${escapeHtml(fmtMoeda(p.contraproposta_valor))}</strong></div>
  ${p.contraproposta_obs ? `<div style="margin-top: 6px; white-space: pre-wrap;">${nl2br(p.contraproposta_obs)}</div>` : ''}
</div>` : ''}

${p.observacoes ? `
<div class="section">
  <div class="section-title">Observações</div>
  <div class="text-block">${nl2br(p.observacoes)}</div>
</div>` : ''}

<div class="cidade-data">${escapeHtml(cidade)}/${escapeHtml(estado)}, ${escapeHtml(dataHoje)}.</div>

<div class="assinaturas">
  <div class="assinatura">
    <div class="linha">
      <div class="nome">${escapeHtml(p.comprador.nome) || 'Comprador'}</div>
      ${p.comprador.cpf_cnpj ? `<div class="doc">CPF/CNPJ: ${escapeHtml(p.comprador.cpf_cnpj)}</div>` : ''}
      <div class="doc">Comprador / Proponente</div>
    </div>
  </div>
  <div class="assinatura">
    <div class="linha">
      <div class="nome">${escapeHtml(MORADDA_DADOS?.nome || 'Moradda Imobiliária')}</div>
      ${MORADDA_DADOS?.cpf_cnpj ? `<div class="doc">CNPJ: ${escapeHtml(MORADDA_DADOS.cpf_cnpj)}</div>` : ''}
      ${MORADDA_DADOS?.creci ? `<div class="doc">CRECI: ${escapeHtml(MORADDA_DADOS.creci)}</div>` : ''}
      <div class="doc">Imobiliária / Intermediária</div>
    </div>
  </div>
</div>
`
}

export function printProposta(data: PropostaPdfData) {
  const body = buildBody(data)
  const titulo = `Proposta ${data.numero}`

  const fullHtml = `${UTF8_BOM}<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${escapeHtml(titulo)}</title>
<style>${propostaCss}</style>
</head>
<body>
<div class="content">
${body}
</div>
<script>
window.addEventListener('load', () => {
  setTimeout(() => { window.print(); }, 300);
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
