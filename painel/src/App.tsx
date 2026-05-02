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
import LeadsPage from '@/pages/LeadsPage'
import PrecificacaoPage from '@/pages/PrecificacaoPage'
import CRMPage from '@/pages/CRMPage'
import AprendizadoPage from '@/pages/AprendizadoPage'
import ModuloAulaPage from '@/pages/ModuloAulaPage'
import PerfilPage from '@/pages/PerfilPage'
import AcessosPage from '@/pages/AcessosPage'

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
              <Route path="leads" element={<LeadsPage />} />
              <Route path="precificacao" element={<PrecificacaoPage />} />
              <Route path="crm" element={<CRMPage />} />
              <Route path="aprendizado" element={<AprendizadoPage />} />
              <Route path="aprendizado/modulo/:moduloId" element={<ModuloAulaPage />} />
              <Route path="perfil" element={<PerfilPage />} />
              <Route path="acessos" element={<AcessosPage />} />
            </Route>
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
