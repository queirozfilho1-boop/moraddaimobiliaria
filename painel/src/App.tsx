import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import PainelLayout from '@/components/PainelLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import ImoveisPage from '@/pages/ImoveisPage'
import NovoImovelPage from '@/pages/NovoImovelPage'
import EditarImovelPage from '@/pages/EditarImovelPage'
import ContratosPage from '@/pages/ContratosPage'
import ContratoEditorPage from '@/pages/ContratoEditorPage'
import { ModelosContratoListPage, ModeloContratoEditorPage } from '@/pages/ModelosContratoPage'
import { ProprietariosListPage, ProprietarioEditorPage } from '@/pages/ProprietariosPage'
import DashboardFinanceiroPage from '@/pages/DashboardFinanceiroPage'
import { VendasListPage, VendaEditorPage } from '@/pages/VendasPage'
import VendasPipelinePage from '@/pages/VendasPipelinePage'
import LeadsPipelinePage from '@/pages/LeadsPipelinePage'
import VisitasPage from '@/pages/VisitasPage'
import MarketingPage from '@/pages/MarketingPage'
import { VistoriaListPage, VistoriaEditorPage } from '@/pages/VistoriaPage'
import { PropostasListPage, PropostaEditorPage } from '@/pages/PropostasPage'
import LeadsPage from '@/pages/LeadsPage'
import PrecificacaoPage from '@/pages/PrecificacaoPage'
import CRMPage from '@/pages/CRMPage'
import AprendizadoPage from '@/pages/AprendizadoPage'
import ModuloAulaPage from '@/pages/ModuloAulaPage'
import PerfilPage from '@/pages/PerfilPage'
import AcessosPage from '@/pages/AcessosPage'
import CorretoresPage from '@/pages/CorretoresPage'
import BannersPage from '@/pages/BannersPage'
import BlogPage from '@/pages/BlogPage'
import DepoimentosPage from '@/pages/DepoimentosPage'
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
              <Route path="contratos" element={<ContratosPage />} />
              <Route path="contratos/novo" element={<ContratoEditorPage />} />
              <Route path="contratos/:id" element={<ContratoEditorPage />} />
              <Route path="modelos-contrato" element={<ModelosContratoListPage />} />
              <Route path="modelos-contrato/novo" element={<ModeloContratoEditorPage />} />
              <Route path="modelos-contrato/:id" element={<ModeloContratoEditorPage />} />
              <Route path="proprietarios" element={<ProprietariosListPage />} />
              <Route path="proprietarios/novo" element={<ProprietarioEditorPage />} />
              <Route path="proprietarios/:id" element={<ProprietarioEditorPage />} />
              <Route path="financeiro" element={<DashboardFinanceiroPage />} />
              <Route path="vendas" element={<VendasListPage />} />
              <Route path="vendas/pipeline" element={<VendasPipelinePage />} />
              <Route path="vendas/novo" element={<VendaEditorPage />} />
              <Route path="vendas/:id" element={<VendaEditorPage />} />
              <Route path="propostas" element={<PropostasListPage />} />
              <Route path="propostas/novo" element={<PropostaEditorPage />} />
              <Route path="propostas/:id" element={<PropostaEditorPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="leads/pipeline" element={<LeadsPipelinePage />} />
              <Route path="visitas" element={<VisitasPage />} />
              <Route path="marketing" element={<MarketingPage />} />
              <Route path="vistorias" element={<VistoriaListPage />} />
              <Route path="vistorias/novo" element={<VistoriaEditorPage />} />
              <Route path="vistorias/:id" element={<VistoriaEditorPage />} />
              <Route path="precificacao" element={<PrecificacaoPage />} />
              <Route path="crm" element={<CRMPage />} />
              <Route path="aprendizado" element={<AprendizadoPage />} />
              <Route path="aprendizado/modulo/:moduloId" element={<ModuloAulaPage />} />
              <Route path="perfil" element={<PerfilPage />} />
              <Route path="acessos" element={<AcessosPage />} />
              <Route path="corretores" element={<CorretoresPage />} />
              <Route path="banners" element={<BannersPage />} />
              <Route path="blog" element={<BlogPage />} />
              <Route path="depoimentos" element={<DepoimentosPage />} />
              <Route path="relatorios" element={<RelatoriosPage />} />
              <Route path="configuracoes" element={<ConfiguracoesPage />} />
            </Route>
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
