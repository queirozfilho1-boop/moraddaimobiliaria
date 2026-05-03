import { fmtMoeda, fmtData, MORADDA_DADOS } from './contratos'
import contratoCss from './contratoStyle.css?raw'

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

function clauseHeading(num: number, titulo: string): string {
  return `<h2 class="clause-heading"><span class="clause-num">${num}</span><span class="clause-title">${escapeHtml(titulo)}</span></h2>`
}

function buildBody(p: PropostaPdfData): string {
  const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const cidade = (MORADDA_DADOS as any)?.cidade || 'Resende'
  const estado = (MORADDA_DADOS as any)?.estado || 'RJ'
  const moraddaNome = (MORADDA_DADOS as any)?.nome || 'Moradda Imobiliária'
  const moraddaCnpj = (MORADDA_DADOS as any)?.cpf_cnpj
  const moraddaCreci = (MORADDA_DADOS as any)?.creci

  const imovelLinha = enderecoImovel(p.imovel)

  const compradorEnd = [p.comprador.endereco, p.comprador.cidade, p.comprador.estado]
    .filter(Boolean)
    .join(', ')

  let n = 1

  return `
<h1>Proposta de Compra</h1>
<h2>${escapeHtml(p.numero)}</h2>
<p>${escapeHtml(cidade)}, ${escapeHtml(dataHoje)}</p>

<h2 class="parties-header">IMÓVEL OBJETO DA PROPOSTA</h2>
<div class="parties-card">
  ${p.imovel.codigo || p.imovel.titulo ? `<p><strong>${escapeHtml(p.imovel.codigo || '')}${p.imovel.codigo && p.imovel.titulo ? ' — ' : ''}${escapeHtml(p.imovel.titulo || '')}</strong></p>` : ''}
  ${imovelLinha ? `<p>${escapeHtml(imovelLinha)}</p>` : ''}
  ${p.imovel.matricula ? `<p>Matrícula: <strong>${escapeHtml(p.imovel.matricula)}</strong>${p.imovel.cartorio ? ` · ${escapeHtml(p.imovel.cartorio)}` : ''}</p>` : ''}
</div>

<h2 class="parties-header">PROPONENTE / COMPRADOR</h2>
<div class="parties-card">
  <p><strong>${escapeHtml(p.comprador.nome) || '—'}</strong>${p.comprador.cpf_cnpj ? `, inscrito(a) sob o CPF/CNPJ <strong>${escapeHtml(p.comprador.cpf_cnpj)}</strong>` : ''}.</p>
  ${(p.comprador.email || p.comprador.telefone) ? `<p>${p.comprador.email ? `E-mail: <strong>${escapeHtml(p.comprador.email)}</strong>` : ''}${(p.comprador.email && p.comprador.telefone) ? ' · ' : ''}${p.comprador.telefone ? `Telefone: <strong>${escapeHtml(p.comprador.telefone)}</strong>` : ''}</p>` : ''}
  ${compradorEnd ? `<p>Endereço: ${escapeHtml(compradorEnd)}</p>` : ''}
</div>

${clauseHeading(n++, 'Valor Proposto')}
<div class="alert-info"><strong>R$ proposto:</strong> ${escapeHtml(fmtMoeda(p.valor))}</div>
<p>O proponente apresenta a presente oferta de compra do imóvel acima identificado pelo valor total acima informado, nos termos e condições estabelecidos a seguir.</p>

${p.forma_pagamento ? `${clauseHeading(n++, 'Forma de Pagamento')}<p>${nl2br(p.forma_pagamento)}</p>` : ''}

${p.condicoes ? `${clauseHeading(n++, 'Condições')}<p>${nl2br(p.condicoes)}</p>` : ''}

${p.prazo_resposta ? `${clauseHeading(n++, 'Prazo para Resposta')}<p>O presente documento aguardará manifestação do vendedor até <strong>${escapeHtml(fmtData(p.prazo_resposta))}</strong>, após o que se considerará automaticamente caduco caso não haja aceitação expressa.</p>` : ''}

${p.contraproposta_valor ? `${clauseHeading(n++, 'Contraproposta do Vendedor')}<div class="alert-warning"><strong>Contraproposta:</strong> ${escapeHtml(fmtMoeda(p.contraproposta_valor))}</div>${p.contraproposta_obs ? `<p>${nl2br(p.contraproposta_obs)}</p>` : ''}` : ''}

${p.observacoes ? `${clauseHeading(n++, 'Observações')}<p>${nl2br(p.observacoes)}</p>` : ''}

<hr/>

<p>E, por estarem assim justos e acordados quanto aos termos da presente proposta, firmam o presente documento para os devidos fins.</p>

<p style="text-align: right; margin-top: 0.6cm;">${escapeHtml(cidade)}/${escapeHtml(estado)}, ${escapeHtml(dataHoje)}.</p>

<div class="signature-block">
  <div class="sig-line"></div>
  <div class="sig-label">
    <strong>${escapeHtml(p.comprador.nome) || 'PROPONENTE / COMPRADOR'}</strong>
    ${p.comprador.cpf_cnpj ? `<br/>CPF/CNPJ: ${escapeHtml(p.comprador.cpf_cnpj)}` : ''}
  </div>
</div>

<div class="signature-block">
  <div class="sig-line"></div>
  <div class="sig-label">
    <strong>${escapeHtml(moraddaNome)}</strong>
    ${moraddaCnpj ? `<br/>CNPJ: ${escapeHtml(moraddaCnpj)}` : ''}
    ${moraddaCreci ? `<br/>CRECI: ${escapeHtml(moraddaCreci)}` : ''}
    <br/>Imobiliária Intermediária
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
<style>${contratoCss}</style>
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
