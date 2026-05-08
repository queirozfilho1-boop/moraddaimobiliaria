// Ambient declarations para pannellum (CDN no index.html do site público).

interface PannellumHotSpot {
  pitch: number
  yaw: number
  type: 'scene' | 'info'
  text?: string
  sceneId?: string
  URL?: string
  cssClass?: string
}

interface PannellumScene {
  title?: string
  type: 'equirectangular' | 'cubemap' | 'multires'
  panorama?: string
  hfov?: number
  pitch?: number
  yaw?: number
  hotSpots?: PannellumHotSpot[]
  autoLoad?: boolean
}

interface PannellumViewerConfig {
  default?: {
    firstScene?: string
    sceneFadeDuration?: number
    autoLoad?: boolean
    hfov?: number
    showControls?: boolean
    autoRotate?: number
  }
  scenes?: Record<string, PannellumScene>
}

interface PannellumViewer {
  destroy(): void
  loadScene(sceneId: string): void
  getScene(): string
  getPitch(): number
  getYaw(): number
  on(event: string, handler: (...args: unknown[]) => void): void
}

interface PannellumGlobal {
  viewer(container: string | HTMLElement, config: PannellumViewerConfig): PannellumViewer
}

interface Window {
  pannellum?: PannellumGlobal
}
