import { supabase } from '@/lib/supabase'

/**
 * Rastreamento de campanhas (UTM).
 *
 * Na chegada ao site, os parâmetros utm_* da URL (colocados nos anúncios da
 * Meta/Google) são salvos no localStorage por 30 dias (last-touch: uma nova
 * campanha sobrescreve a anterior). Quando o visitante vira lead (formulário)
 * ou clica no WhatsApp, a origem viaja junto.
 */

const KEY = 'moradda_utm'
const DIAS_VALIDADE = 30

export interface UTMData {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  referrer: string | null
  landing_page: string | null
}

/** Chamar uma vez no carregamento do app. */
export function capturarUTM(): void {
  try {
    const params = new URLSearchParams(window.location.search)
    const temUtm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
      .some((k) => params.get(k))
    // fbclid/gclid sem utm_source ainda indicam anúncio pago
    const clickId = params.get('fbclid') ? 'facebook' : params.get('gclid') ? 'google' : null

    if (!temUtm && !clickId) return

    const data: UTMData & { salvo_em: number } = {
      utm_source: params.get('utm_source') || clickId,
      utm_medium: params.get('utm_medium') || (clickId ? 'paid' : null),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
      referrer: document.referrer || null,
      landing_page: window.location.pathname + window.location.search,
      salvo_em: Date.now(),
    }
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* localStorage indisponível — segue sem rastreio */
  }
}

/** UTM vigente (ou tudo null se o visitante chegou sem campanha). */
export function getUTM(): UTMData {
  const vazio: UTMData = {
    utm_source: null, utm_medium: null, utm_campaign: null,
    utm_content: null, utm_term: null, referrer: null, landing_page: null,
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return vazio
    const data = JSON.parse(raw)
    if (Date.now() - (data.salvo_em || 0) > DIAS_VALIDADE * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(KEY)
      return vazio
    }
    const { salvo_em: _ignorado, ...utm } = data
    return { ...vazio, ...utm }
  } catch {
    return vazio
  }
}

/** Registra um evento do site (ex.: clique no WhatsApp) com a origem vigente. */
export function registrarEvento(
  tipo: 'whatsapp_click' | 'form_lead',
  imovelId?: string | null
): void {
  const utm = getUTM()
  // fire-and-forget: não bloqueia a navegação do visitante
  void supabase.from('site_eventos').insert({
    tipo,
    pagina: window.location.pathname,
    imovel_id: imovelId || null,
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
    utm_content: utm.utm_content,
    utm_term: utm.utm_term,
    referrer: utm.referrer,
  })
}
