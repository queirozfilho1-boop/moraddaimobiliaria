import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'sonner'
import Layout from '@/components/layout/Layout'
import ScrollToTop from '@/components/common/ScrollToTop'

const HomePage = lazy(() => import('@/pages/Home'))
const ImoveisPage = lazy(() => import('@/pages/Imoveis'))
const ImovelDetalhePage = lazy(() => import('@/pages/ImovelDetalhe'))
const SobrePage = lazy(() => import('@/pages/Sobre'))
const EquipePage = lazy(() => import('@/pages/Equipe'))
const CorretorPage = lazy(() => import('@/pages/Corretor'))
const BlogPage = lazy(() => import('@/pages/Blog'))
const BlogPostPage = lazy(() => import('@/pages/BlogPost'))
const BairrosPage = lazy(() => import('@/pages/Bairros'))
const BairroPage = lazy(() => import('@/pages/Bairro'))
const ContatoPage = lazy(() => import('@/pages/Contato'))
const AvaliacaoPage = lazy(() => import('@/pages/Avaliacao'))
const VenderPage = lazy(() => import('@/pages/Vender'))
const FinanciamentoPage = lazy(() => import('@/pages/Financiamento'))
const FavoritosPage = lazy(() => import('@/pages/Favoritos'))
const PoliticaPage = lazy(() => import('@/pages/Politica'))
const NotFoundPage = lazy(() => import('@/pages/NotFound'))

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-moradda-blue-200 border-t-moradda-blue-500" />
            </div>
          }
        >
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/imoveis" element={<ImoveisPage />} />
              <Route path="/imoveis/:slug" element={<ImovelDetalhePage />} />
              <Route path="/sobre" element={<SobrePage />} />
              <Route path="/equipe" element={<EquipePage />} />
              <Route path="/equipe/:slug" element={<CorretorPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/bairros" element={<BairrosPage />} />
              <Route path="/bairros/:slug" element={<BairroPage />} />
              <Route path="/contato" element={<ContatoPage />} />
              <Route path="/avaliacao" element={<AvaliacaoPage />} />
              <Route path="/vender" element={<VenderPage />} />
              <Route path="/financiamento" element={<FinanciamentoPage />} />
              <Route path="/favoritos" element={<FavoritosPage />} />
              <Route path="/politica-de-privacidade" element={<PoliticaPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </HelmetProvider>
  )
}

export default App
