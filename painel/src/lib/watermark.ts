import { supabase } from './supabase'
import heic2any from 'heic2any'
import logoWatermarkUrl from '@/assets/logo-watermark.png'

// Opacidade reforçada (era 0.22 — marca ficava transparente demais nas fotos claras)
const WATERMARK_OPACITY = 0.45
const WATERMARK_RATIO = 0.30

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // crossOrigin só é necessário para URLs remotas. Em blob:/data: (arquivo local)
    // forçar crossOrigin='anonymous' pode disparar onerror em alguns navegadores.
    if (!/^(blob:|data:)/i.test(src)) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function isHeic(file: File): boolean {
  const t = (file.type || '').toLowerCase()
  const n = (file.name || '').toLowerCase()
  return t.includes('heic') || t.includes('heif') || /\.(heic|heif)$/.test(n)
}

/**
 * Converte HEIC/HEIF (fotos de iPhone) para JPEG no navegador.
 * Navegadores não decodificam HEIC em <img>/canvas nem exibem no site,
 * então convertemos antes de qualquer processamento. Formatos já suportados passam direto.
 */
export async function toWebImage(file: File): Promise<File> {
  if (!isHeic(file)) return file
  const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
  const blob = (Array.isArray(out) ? out[0] : out) as Blob
  const name = file.name.replace(/\.(heic|heif)$/i, '.jpg') || `foto-${Date.now()}.jpg`
  return new File([blob], name, { type: 'image/jpeg' })
}

/**
 * Aplica marca d'água localmente via Canvas (sem API externa)
 * Usa compositing source-in para manter qualidade da logo branca
 */
async function applyWatermarkLocal(file: File): Promise<{ watermarked: Blob; thumb: Blob }> {
  // Carregar imagem original do File
  const originalUrl = URL.createObjectURL(file)
  const img = await loadImage(originalUrl)
  URL.revokeObjectURL(originalUrl)

  // Carregar logo branca
  const logo = await loadImage(logoWatermarkUrl)

  // --- Imagem com marca d'água ---
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  ctx.drawImage(img, 0, 0)

  // Calcular tamanho e posição da marca d'água
  const wmWidth = Math.round(canvas.width * WATERMARK_RATIO)
  const wmHeight = Math.round((logo.naturalHeight / logo.naturalWidth) * wmWidth)
  const wmX = Math.round((canvas.width - wmWidth) / 2)
  const wmY = Math.round((canvas.height - wmHeight) / 2)

  // Aplicar com opacidade
  ctx.globalAlpha = WATERMARK_OPACITY
  ctx.drawImage(logo, wmX, wmY, wmWidth, wmHeight)
  ctx.globalAlpha = 1.0

  const watermarked = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.88)
  })

  // --- Thumbnail ---
  const THUMB_W = 600
  const THUMB_H = 450
  const thumbCanvas = document.createElement('canvas')
  const thumbCtx = thumbCanvas.getContext('2d')!
  thumbCtx.imageSmoothingEnabled = true
  thumbCtx.imageSmoothingQuality = 'high'
  thumbCanvas.width = THUMB_W
  thumbCanvas.height = THUMB_H

  const srcRatio = img.naturalWidth / img.naturalHeight
  const destRatio = THUMB_W / THUMB_H
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight
  if (srcRatio > destRatio) {
    sw = Math.round(sh * destRatio)
    sx = Math.round((img.naturalWidth - sw) / 2)
  } else {
    sh = Math.round(sw / destRatio)
    sy = Math.round((img.naturalHeight - sh) / 2)
  }
  thumbCtx.drawImage(img, sx, sy, sw, sh, 0, 0, THUMB_W, THUMB_H)

  // Marca d'água no thumb
  const thumbWmW = Math.round(THUMB_W * 0.25)
  const thumbWmH = Math.round((logo.naturalHeight / logo.naturalWidth) * thumbWmW)
  thumbCtx.globalAlpha = WATERMARK_OPACITY
  thumbCtx.drawImage(logo, Math.round((THUMB_W - thumbWmW) / 2), Math.round((THUMB_H - thumbWmH) / 2), thumbWmW, thumbWmH)
  thumbCtx.globalAlpha = 1.0

  const thumb = await new Promise<Blob>((resolve) => {
    thumbCanvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.80)
  })

  return { watermarked, thumb }
}

/**
 * Upload foto (converte HEIC→JPEG, aplica marca d'água localmente).
 * Resiliente: se a marca d'água falhar, a foto ainda é salva usando o original.
 */
export async function uploadFotoComWatermark(
  fileInput: File,
  imovelId: string,
  index: number
): Promise<{
  url: string
  url_watermark: string
  url_thumb: string
} | null> {
  // Converte HEIC/HEIF (iPhone) → JPEG antes de tudo
  let file = fileInput
  try {
    file = await toWebImage(fileInput)
  } catch (convErr) {
    console.error(`Falha ao converter HEIC (foto ${index + 1}):`, convErr)
  }

  const ts = Date.now()
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()

  try {
    // 1. Upload original (obrigatório — sem isso a foto não existe)
    const origPath = `${imovelId}/original/${ts}-${index}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('imoveis')
      .upload(origPath, file, { contentType: file.type || 'image/jpeg', upsert: true })
    if (uploadError) {
      console.error('Erro upload original:', uploadError)
      throw uploadError
    }
    const { data: origData } = supabase.storage.from('imoveis').getPublicUrl(origPath)
    const originalUrl = origData.publicUrl

    // 2. Marca d'água + thumbnail (best-effort — se falhar, salvamos o original mesmo assim)
    let wmPublicUrl = originalUrl
    let thumbPublicUrl = originalUrl
    try {
      const { watermarked, thumb } = await applyWatermarkLocal(file)

      const wmPath = `${imovelId}/watermark/${ts}-${index}.webp`
      const { error: wmErr } = await supabase.storage
        .from('imoveis')
        .upload(wmPath, watermarked, { contentType: 'image/webp', upsert: true })
      if (!wmErr) {
        wmPublicUrl = supabase.storage.from('imoveis').getPublicUrl(wmPath).data.publicUrl
      } else {
        console.warn('Erro upload marca d\'água:', wmErr)
      }

      const thumbPath = `${imovelId}/thumb/${ts}-${index}.webp`
      const { error: thErr } = await supabase.storage
        .from('imoveis')
        .upload(thumbPath, thumb, { contentType: 'image/webp', upsert: true })
      if (!thErr) {
        thumbPublicUrl = supabase.storage.from('imoveis').getPublicUrl(thumbPath).data.publicUrl
      }
    } catch (wmErr) {
      console.warn(`Marca d'água falhou (foto ${index + 1}) — salvando o original:`, wmErr)
    }

    return {
      url: originalUrl,
      url_watermark: wmPublicUrl,
      url_thumb: thumbPublicUrl,
    }
  } catch (err) {
    console.error(`Erro fatal foto ${index + 1}:`, err)
    return null
  }
}
