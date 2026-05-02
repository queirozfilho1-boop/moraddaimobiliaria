// Supabase Edge Function — Feed XML VRSync
// Deploy: supabase functions deploy vrsync-feed --no-verify-jwt
//
// URL pública: https://<project>.supabase.co/functions/v1/vrsync-feed
// (ou via CDN/proxy: https://moradda.com.br/feeds/vrsync.xml)
//
// Padrão VRSync v3 — aceito por Zap+, VivaReal, OLX, Imovelweb, ImovelGuide
// Documentação: https://github.com/grupozap/vrsync-schema

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SITE_URL = 'https://moradda.com.br'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

function escapeXml(s: any): string {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function cdata(s: any): string {
  if (s == null) return ''
  return `<![CDATA[${String(s).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

// VRSync code mappings — aceitos pelos portais
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
  // Comerciais
  sala_comercial:     { categoria: 'Comercial',   tipo: 'Sala' },
  loja:               { categoria: 'Comercial',   tipo: 'Loja' },
  galpao:             { categoria: 'Comercial',   tipo: 'Galpão / Depósito' },
  predio:             { categoria: 'Comercial',   tipo: 'Prédio Inteiro' },
}

function mapTipo(t?: string | null): { categoria: string; tipo: string } {
  if (!t) return { categoria: 'Residencial', tipo: 'Apartamento' }
  const key = t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '_')
  return TIPO_MAP[key] || { categoria: 'Residencial', tipo: 'Apartamento' }
}

function buildXml(imoveis: any[]): string {
  const now = new Date().toISOString()
  const items = imoveis.map((im) => {
    const fotos: any[] = im.imoveis_fotos || []
    const principal = fotos.find((f) => f.principal) || fotos[0]
    const fotosOrdenadas = [...fotos].sort((a, b) => {
      if (a.principal && !b.principal) return -1
      if (b.principal && !a.principal) return 1
      return (a.ordem ?? 0) - (b.ordem ?? 0)
    })

    const { categoria, tipo } = mapTipo(im.tipo)
    const finalidade = im.finalidade?.toLowerCase() || 'venda'
    const transacao =
      finalidade === 'venda' ? 'For Sale' :
      finalidade === 'temporada' ? 'Season Rental' : 'For Rent'

    const slug = im.slug || im.id
    const url = `${SITE_URL}/imoveis/${slug}`

    return `
    <Listing>
      <ListingID>${escapeXml(im.codigo || im.id)}</ListingID>
      <Title>${cdata(im.titulo || tipo)}</Title>
      <TransactionType>${escapeXml(transacao)}</TransactionType>
      <PublicationType>STANDARD</PublicationType>
      <ListPrice>${im.preco || 0}</ListPrice>
      ${im.condominio ? `<MonthlyCondoFee>${im.condominio}</MonthlyCondoFee>` : ''}
      ${im.iptu_anual ? `<YearlyTax>${im.iptu_anual}</YearlyTax>` : ''}
      <Details>
        <PropertyType>${escapeXml(categoria)}</PropertyType>
        <PropertySubtype>${escapeXml(tipo)}</PropertySubtype>
        <Description>${cdata(im.descricao || im.titulo || '')}</Description>
        ${im.area_total ? `<LotArea>${im.area_total}</LotArea>` : ''}
        ${im.area_construida ? `<LivingArea>${im.area_construida}</LivingArea>` : ''}
        ${im.quartos ? `<Bedrooms>${im.quartos}</Bedrooms>` : ''}
        ${im.suites ? `<Suites>${im.suites}</Suites>` : ''}
        ${im.banheiros ? `<Bathrooms>${im.banheiros}</Bathrooms>` : ''}
        ${im.vagas ? `<Garage>${im.vagas}</Garage>` : ''}
        ${im.tour_virtual_url ? `<VirtualTour>${escapeXml(im.tour_virtual_url)}</VirtualTour>` : ''}
        ${im.video_url ? `<Videos><Video><VideoURL>${escapeXml(im.video_url)}</VideoURL></Video></Videos>` : ''}
        ${
          fotosOrdenadas.length
            ? `<Media>${fotosOrdenadas
                .map(
                  (f, idx) => `<Item caption="Foto ${idx + 1}" medium="image" primary="${idx === 0 ? 'true' : 'false'}">${escapeXml(f.url_watermark || f.url)}</Item>`
                )
                .join('')}</Media>`
            : ''
        }
        ${
          im.caracteristicas && Array.isArray(im.caracteristicas) && im.caracteristicas.length
            ? `<Features>${im.caracteristicas
                .map((f: string) => `<Feature>${escapeXml(f)}</Feature>`)
                .join('')}</Features>`
            : ''
        }
      </Details>
      <Location displayAddress="Neighborhood">
        <Country abbreviation="BR">Brasil</Country>
        <State abbreviation="${escapeXml((im.estado || 'MG').toUpperCase())}">${escapeXml(im.estado || 'Minas Gerais')}</State>
        <City>${escapeXml(im.cidade || '')}</City>
        ${im.bairros?.nome ? `<Neighborhood>${escapeXml(im.bairros.nome)}</Neighborhood>` : ''}
        ${im.endereco ? `<Address>${escapeXml(im.endereco)}</Address>` : ''}
        ${im.numero ? `<StreetNumber>${escapeXml(im.numero)}</StreetNumber>` : ''}
        ${im.complemento ? `<Complement>${escapeXml(im.complemento)}</Complement>` : ''}
        ${im.cep ? `<PostalCode>${escapeXml(im.cep.replace(/\D/g, ''))}</PostalCode>` : ''}
      </Location>
      <ContactInfo>
        <Name>Moradda Imobiliária</Name>
        <Email>contato@moradda.com.br</Email>
        ${im.users_profiles?.nome ? `<RealtorName>${escapeXml(im.users_profiles.nome)}</RealtorName>` : ''}
      </ContactInfo>
      <ListingURL>${escapeXml(url)}</ListingURL>
    </Listing>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://gz-schemas.s3.amazonaws.com/vrsync-schema-1.0.1.xsd">
  <Header>
    <Provider>Moradda Imobiliária</Provider>
    <Email>contato@moradda.com.br</Email>
    <ContactName>Moradda</ContactName>
    <PublishDate>${now}</PublishDate>
  </Header>
  <Listings>${items}
  </Listings>
</ListingDataFeed>`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: imoveis, error } = await supabase
      .from('imoveis')
      .select(
        `id, codigo, slug, titulo, tipo, finalidade, preco, condominio, iptu_anual,
         area_total, area_construida, quartos, suites, banheiros, vagas,
         endereco, numero, complemento, cep, cidade, estado,
         descricao, caracteristicas, tour_virtual_url, video_url,
         bairros(nome),
         users_profiles!corretor_id(nome),
         imoveis_fotos(url, url_watermark, ordem, principal)`
      )
      .eq('status', 'publicado')

    if (error) throw error

    const xml = buildXml(imoveis || [])

    return new Response(xml, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    })
  } catch (err: any) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>\n<error>${escapeXml(err.message || 'Internal error')}</error>`,
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
