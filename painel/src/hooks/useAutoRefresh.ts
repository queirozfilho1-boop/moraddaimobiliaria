import { useEffect, useRef } from 'react'

/**
 * Recarrega dados da tela em intervalos curtos e imediatamente quando o
 * painel dispara o evento global 'moradda:refresh' (ex.: novo lead em
 * tempo real detectado pelo PainelLayout).
 */
export function useAutoRefresh(cb: () => void, intervalMs = 60000) {
  const ref = useRef(cb)
  ref.current = cb

  useEffect(() => {
    const run = () => {
      // não atualiza com a aba em segundo plano (economiza requisições)
      if (document.visibilityState === 'visible') ref.current()
    }
    const t = setInterval(run, intervalMs)
    window.addEventListener('moradda:refresh', run)
    // ao voltar para a aba, atualiza na hora
    const onVisible = () => {
      if (document.visibilityState === 'visible') ref.current()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(t)
      window.removeEventListener('moradda:refresh', run)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs])
}
