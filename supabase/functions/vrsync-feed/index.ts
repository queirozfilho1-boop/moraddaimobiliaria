// Supabase Edge Function — Feed XML VRSync
// URL pública: https://<project>.supabase.co/functions/v1/vrsync-feed
// Padrão VRSync v3 — aceito por Zap+, VivaReal, OLX, Imovelweb, ImovelGuide

const SITE_URL = 'https://moradda.com.br'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

function escapeXml(s: unknown): string {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function cdata(s: unknown): string {
  if (s == null) return ''
  const safe = String(s).replace(/\]\]>/g, ']]]]><![CDATA[>')
  return '<![CDATA[' + safe + ']]>'
}

const TIPO_MAP: Record<string, { categoria: string; tipo: string }> = {
  apartamento:        { categoria: 'Residencial', tipo: 'Apartamento' },
  apartamento_padrao: { categoria: 'Residencial', tipo: 'Apartamento' },
  casa:               { categoria: 'Residencial', tipo: 'Casa Padrão' },
  casa_padrao:        { categoria: 'Residencial', tipo: 'Casa Padrão' },
  cobertura:          { categoria: 'Residencial', tipo: 'Cobertura' },
  flat:               { categoria: 'Residencial', tipo: 'Flat' },
  kitnet:             { categoria: 'Residencial', tipo: 'Kitnet' },
  loft:               { categoria: 'Residencial', tipo: 'Loft' },
  sobrado:            { categoria: 'Residencial', tipo: 'Sobrado' },
  terreno:            { categoria: 'Residencial', tipo: 'Terreno Padrão' },
  lote:               { categoria: 'Residencial', tipo: 'Terreno Padrão' },
  chacara:            { categoria: 'Residencial', tipo: 'Chácara' },
  sitio:              { categoria: 'Residencial', tipo: 'Sítio' },
  fazenda:            { categoria: 'Residencial', tipo: 'Fazenda' },
  sala_comercial:     { categoria: 'Comercial',   tipo: 'Sala' },
  loja:               { categoria: 'Comercial',   tipo: 'Loja' },
  galpao:             { categoria: 'Comercial',   tipo: 'Galpão / Depósito' },
  predio:             { categoria: 'Comercial',   tipo: 'Prédio Inteiro' },
}

function mapTipo(t?: string | null): { categoria: string; tipo: string } {
  if (!t) return { categoria: 'Residencial', tipo: 'Apartamento' }
  const key = t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '_')
  return TIPO_MAP[key] || { categoria: 'Residencial', tipo: 'Apartamento' }
}

function buildXml(imoveis: Array<Record<string, unknown>>): string {
  const now = new Date().toISOString()
  const items = imoveis.map((im) => {
    const fotos = (im.imoveis_fotos as Array<Record<string, unknown>>) || []
    const fotosOrdenadas = [...fotos].sort((a, b) => {
      if (a.principal && !b.principal) return -1
      if (b.principal && !a.principal) return 1
      return ((a.ordem as number) ?? 0) - ((b.ordem as number) ?? 0)
    })

    const { categoria, tipo } = mapTipo(im.tipo as string | undefined)
    const finalidade = ((im.finalidade as string) || 'venda').toLowerCase()
    const transacao =
      finalidade === 'venda' ? 'For Sale' :
      finalidade === 'temporada' ? 'Season Rental' : 'For Rent'

    const slug = (im.slug as string) || (im.id as string)
    const url = `${SITE_URL}/imoveis/${slug}`
    const bairro = im.bairros as { nome?: string } | null
    const corretor = im.users_profiles as { nome?: string } | null
    const caracteristicas = im.caracteristicas as string[] | null

    const parts: string[] = []
    parts.push('    <Listing>')
    parts.push(`      <ListingID>${escapeXml(im.codigo || im.id)}</ListingID>`)
    parts.push(`      <Title>${cdata(im.titulo || tipo)}</Title>`)
    parts.push(`      <TransactionType>${escapeXml(transacao)}</TransactionType>`)
    parts.push('      <PublicationType>STANDARD</PublicationType>')
    parts.push(`      <ListPrice>${im.preco || 0}</ListPrice>`)
    if (im.preco_condominio) parts.push(`      <MonthlyCondoFee>${im.preco_condominio}</MonthlyCondoFee>`)
    if (im.preco_iptu) parts.push(`      <YearlyTax>${im.preco_iptu}</YearlyTax>`)
    parts.push('      <Details>')
    parts.push(`        <PropertyType>${escapeXml(categoria)}</PropertyType>`)
    parts.push(`        <PropertySubtype>${escapeXml(tipo)}</PropertySubtype>`)
    parts.push(`        <Description>${cdata(im.descricao || im.titulo || '')}</Description>`)
    if (im.area_total) parts.push(`        <LotArea>${im.area_total}</LotArea>`)
    if (im.area_construida) parts.push(`        <LivingArea>${im.area_construida}</LivingArea>`)
    if (im.quartos) parts.push(`        <Bedrooms>${im.quartos}</Bedrooms>`)
    if (im.suites) parts.push(`        <Suites>${im.suites}</Suites>`)
    if (im.banheiros) parts.push(`        <Bathrooms>${im.banheiros}</Bathrooms>`)
    if (im.vagas_garagem) parts.push(`        <Garage>${im.vagas_garagem}</Garage>`)
    if (im.tour_virtual_url) parts.push(`        <VirtualTour>${escapeXml(im.tour_virtual_url)}</VirtualTour>`)
    if (im.video_url) parts.push(`        <Videos><Video><VideoURL>${escapeXml(im.video_url)}</VideoURL></Video></Videos>`)
    if (fotosOrdenadas.length) {
      const media = fotosOrdenadas.map((f, idx) =>
        `<Item caption="Foto ${idx + 1}" medium="image" primary="${idx === 0 ? 'true' : 'false'}">${escapeXml(f.url_watermark || f.url)}</Item>`
      ).join('')
      parts.push(`        <Media>${media}</Media>`)
    }
    if (caracteristicas && Array.isArray(caracteristicas) && caracteristicas.length) {
      const feats = caracteristicas.map((f) => `<Feature>${escapeXml(f)}</Feature>`).join('')
      parts.push(`        <Features>${feats}</Features>`)
    }
    parts.push('      </Details>')
    parts.push('      <Location displayAddress="Neighborhood">')
    parts.push('        <Country abbreviation="BR">Brasil</Country>')
    const estado = ((im.estado as string) || 'MG').toUpperCase()
    parts.push(`        <State abbreviation="${escapeXml(estado)}">${escapeXml(im.estado || 'Minas Gerais')}</State>`)
    parts.push(`        <City>${escapeXml(im.cidade || '')}</City>`)
    if (bairro && bairro.nome) parts.push(`        <Neighborhood>${escapeXml(bairro.nome)}</Neighborhood>`)
    if (im.endereco) parts.push(`        <Address>${escapeXml(im.endereco)}</Address>`)
    if (im.numero) parts.push(`        <StreetNumber>${escapeXml(im.numero)}</StreetNumber>`)
    if (im.complemento) parts.push(`        <Complement>${escapeXml(im.complemento)}</Complement>`)
    if (im.cep) parts.push(`        <PostalCode>${escapeXml(String(im.cep).replace(/\D/g, ''))}</PostalCode>`)
    parts.push('      </Location>')
    parts.push('      <ContactInfo>')
    parts.push('        <Name>Moradda Imobiliária</Name>')
    parts.push('        <Email>contato@moradda.com.br</Email>')
    if (corretor && corretor.nome) parts.push(`        <RealtorName>${escapeXml(corretor.nome)}</RealtorName>`)
    parts.push('      </ContactInfo>')
    parts.push(`      <ListingURL>${escapeXml(url)}</ListingURL>`)
    parts.push('    </Listing>')
    return parts.join('\n')
  }).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<ListingDataFeed xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://gz-schemas.s3.amazonaws.com/vrsync-schema-1.0.1.xsd">',
    '  <Header>',
    '    <Provider>Moradda Imobiliária</Provider>',
    '    <Email>contato@moradda.com.br</Email>',
    '    <ContactName>Moradda</ContactName>',
    `    <PublishDate>${now}</PublishDate>`,
    '  </Header>',
    '  <Listings>',
    items,
    '  </Listings>',
    '</ListingDataFeed>',
  ].join('\n')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const select = [
      'id', 'codigo', 'slug', 'titulo', 'tipo', 'finalidade', 'preco', 'preco_condominio', 'preco_iptu',
      'area_total', 'area_construida', 'quartos', 'suites', 'banheiros', 'vagas_garagem',
      'endereco', 'numero', 'complemento', 'cep', 'cidade', 'estado',
      'descricao', 'caracteristicas', 'tour_virtual_url', 'video_url',
      'bairros(nome)',
      'users_profiles!corretor_id(nome)',
      'imoveis_fotos(url,url_watermark,ordem,principal)',
    ].join(',')

    const url = `${supabaseUrl}/rest/v1/imoveis?select=${encodeURIComponent(select)}&status=eq.publicado`
    const res = await fetch(url, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Supabase REST: ${res.status} ${errText}`)
    }
    const imoveis = await res.json()

    const xml = buildXml((imoveis || []) as Array<Record<string, unknown>>)

    return new Response(xml, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>\n<error>${escapeXml(msg)}</error>`,
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=utf-8',
        },
      }
    )
  }
})
