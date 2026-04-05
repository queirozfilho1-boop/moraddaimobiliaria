import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import PainelLayout from '@/components/PainelLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import ImoveisPage from '@/pages/ImoveisPage'
import NovoImovelPage from '@/pages/NovoImovelPage'
import EditarImovelPage from '@/pages/EditarImovelPage'
import LeadsPage from '@/pages/LeadsPage'
import PrecificacaoPage from '@/pages/PrecificacaoPage'
import BlogPage from '@/pages/BlogPage'
import BairrosPage from '@/pages/BairrosPage'
import DepoimentosPage from '@/pages/DepoimentosPage'
import BannersPage from '@/pages/BannersPage'
import CorretoresPage from '@/pages/CorretoresPage'
import RelatoriosPage from '@/pages/RelatoriosPage'
import ConfiguracoesPage from '@/pages/ConfiguracoesPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/painel/login" element={<Login />} />
            <Route path="/painel" element={<PainelLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="imoveis" element={<ImoveisPage />} />
              <Route path="imoveis/novo" element={<NovoImovelPage />} />
              <Route path="imoveis/:id" element={<EditarImovelPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="precificacao" element={<PrecificacaoPage />} />
              <Route path="blog" element={<BlogPage />} />
              <Route path="bairros" element={<BairrosPage />} />
              <Route path="depoimentos" element={<DepoimentosPage />} />
              <Route path="banners" element={<BannersPage />} />
              <Route path="corretores" element={<CorretoresPage />} />
              <Route path="relatorios" element={<RelatoriosPage />} />
              <Route path="configuracoes" element={<ConfiguracoesPage />} />
            </Route>
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
