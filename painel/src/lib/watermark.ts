import { supabase } from './supabase'
import logoWatermarkUrl from '@/assets/logo-watermark.png'

const WATERMARK_OPACITY = 0.22
const WATERMARK_RATIO = 0.30

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
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
 * Upload foto com marca d'água aplicada localmente
 */
export async function uploadFotoComWatermark(
  file: File,
  imovelId: string,
  index: number
): Promise<{
  url: string
  url_watermark: string
  url_thumb: string
} | null> {
  const ts = Date.now()
  const ext = file.name.split('.').pop() || 'jpg'

  try {
    // 1. Upload original
    const origPath = `${imovelId}/original/${ts}-${index}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('imoveis')
      .upload(origPath, file, { contentType: file.type, upsert: true })
    if (uploadError) {
      console.error('Erro upload original:', uploadError)
      throw uploadError
    }
    const { data: origData } = supabase.storage.from('imoveis').getPublicUrl(origPath)
    const originalUrl = origData.publicUrl

    // 2. Aplicar marca d'água localmente (Canvas, sem API externa)
    const { watermarked, thumb } = await applyWatermarkLocal(file)

    // 3. Upload marca d'água
    const wmPath = `${imovelId}/watermark/${ts}-${index}.webp`
    const { error: wmErr } = await supabase.storage
      .from('imoveis')
      .upload(wmPath, watermarked, { contentType: 'image/webp', upsert: true })

    let wmPublicUrl = originalUrl
    if (!wmErr) {
      const { data: wmData } = supabase.storage.from('imoveis').getPublicUrl(wmPath)
      wmPublicUrl = wmData.publicUrl
    } else {
      console.warn('Erro upload marca d\'água:', wmErr)
    }

    // 4. Upload thumbnail
    const thumbPath = `${imovelId}/thumb/${ts}-${index}.webp`
    const { error: thErr } = await supabase.storage
      .from('imoveis')
      .upload(thumbPath, thumb, { contentType: 'image/webp', upsert: true })

    let thumbPublicUrl = originalUrl
    if (!thErr) {
      const { data: thumbData } = supabase.storage.from('imoveis').getPublicUrl(thumbPath)
      thumbPublicUrl = thumbData.publicUrl
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
