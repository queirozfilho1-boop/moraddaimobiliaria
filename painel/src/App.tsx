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
import AprendizadoPage from '@/pages/AprendizadoPage'
import ModuloAulaPage from '@/pages/ModuloAulaPage'
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
              <Route path="leads" element={<LeadsPage />} />
              <Route path="precificacao" element={<PrecificacaoPage />} />
              <Route path="aprendizado" element={<AprendizadoPage />} />
              <Route path="aprendizado/modulo/:moduloId" element={<ModuloAulaPage />} />
              <Route path="acessos" element={<AcessosPage />} />
            </Route>
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
