// Ambient declarations para a lib pannellum (carregada via CDN no index.html).
// Sem `export` no topo do arquivo: tudo aqui vira global e atende imports type-only
// nos componentes Tour360Viewer / Tour360EditorSection.

interface PannellumHotSpot {
  pitch: number
  yaw: number
  type: 'scene' | 'info'
  text?: string
  sceneId?: string
  URL?: string
  cssClass?: string
  clickHandlerFunc?: (e: unknown, args: unknown) => void
  clickHandlerArgs?: unknown
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
    author?: string
    hfov?: number
    showControls?: boolean
    showZoomCtrl?: boolean
    showFullscreenCtrl?: boolean
    autoRotate?: number
    compass?: boolean
  }
  scenes?: Record<string, PannellumScene>
  type?: 'equirectangular'
  panorama?: string
  autoLoad?: boolean
  hotSpots?: PannellumHotSpot[]
}

interface PannellumViewer {
  destroy(): void
  loadScene(sceneId: string): void
  getScene(): string
  getPitch(): number
  getYaw(): number
  getHfov(): number
  setPitch(pitch: number): void
  setYaw(yaw: number): void
  setHfov(hfov: number): void
  on(event: string, handler: (...args: unknown[]) => void): void
  mouseEventToCoords(event: MouseEvent): [number, number]
  addScene(sceneId: string, config: PannellumScene): void
  removeScene(sceneId: string): void
  addHotSpot(hs: PannellumHotSpot, sceneId?: string): void
  removeHotSpot(id: string, sceneId?: string): void
}

interface PannellumGlobal {
  viewer(container: string | HTMLElement, config: PannellumViewerConfig): PannellumViewer
}

interface Window {
  pannellum?: PannellumGlobal
}
