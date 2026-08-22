import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import EmailVerificationBanner from './components/EmailVerificationBanner'
import RequireAuth from './components/RequireAuth'
import RequireAdmin from './components/RequireAdmin'
import { useAuth } from './context/AuthContext'
import { needsProfileCompletion } from './utils/onboarding'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Payment from './pages/Payment'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import CompleteProfile from './pages/CompleteProfile'
import Orders from './pages/Orders'
import Messages from './pages/Messages'
import PrivacyPolicy from './pages/PrivacyPolicy'
import VerifyEmail from './pages/VerifyEmail'
import FarmerLayout from './pages/farmer/FarmerLayout'
import Dashboard from './pages/farmer/Dashboard'
import MyFarm from './pages/farmer/MyFarm'
import MyProducts from './pages/farmer/MyProducts'
import Sales from './pages/farmer/Sales'
import Monitoring from './pages/farmer/Monitoring'
import Harvests from './pages/farmer/Harvests'
import Insights from './pages/farmer/Insights'
import Soil from './pages/farmer/Soil'
import BuyerDashboard from './pages/buyer/Dashboard'
import TransporterDashboard from './pages/transporter/Dashboard'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminOrders from './pages/admin/Orders'
import AdminFarms from './pages/admin/Farms'

function OnboardingRedirect() {
  const { user } = useAuth()
  const location = useLocation()

  if (needsProfileCompletion(user) && location.pathname !== '/completar-perfil') {
    return <Navigate to="/completar-perfil" replace />
  }
  return null
}

// admin.agrilink.store serves only the admin panel, standalone (no public
// nav/footer), so admins don't land on the marketplace by mistake.
const isAdminHost =
  typeof window !== 'undefined' && window.location.hostname.startsWith('admin.')

function AdminApp() {
  return (
    <main className="flex-1">
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/entrar" element={<Login />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="utilizadores" element={<AdminUsers />} />
          <Route path="encomendas" element={<AdminOrders />} />
          <Route path="lavras" element={<AdminFarms />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </main>
  )
}

function App() {
  if (isAdminHost) {
    return <AdminApp />
  }

  return (
    <>
      <Navbar />
      <EmailVerificationBanner />
      <main className="flex-1">
        <OnboardingRedirect />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mercado" element={<Marketplace />} />
          <Route path="/mercado/:id" element={<ProductDetail />} />
          <Route path="/carrinho" element={<Cart />} />
          <Route
            path="/pagamento/:orderId"
            element={
              <RequireAuth>
                <Payment />
              </RequireAuth>
            }
          />
          <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
          <Route path="/verificar-email" element={<VerifyEmail />} />
          <Route path="/entrar" element={<Login />} />
          <Route path="/registar" element={<Register />} />
          <Route
            path="/perfil"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route
            path="/completar-perfil"
            element={
              <RequireAuth>
                <CompleteProfile />
              </RequireAuth>
            }
          />
          <Route
            path="/minhas-encomendas"
            element={
              <RequireAuth>
                <Orders />
              </RequireAuth>
            }
          />
          <Route
            path="/mensagens"
            element={
              <RequireAuth>
                <Messages />
              </RequireAuth>
            }
          />
          <Route
            path="/mensagens/:id"
            element={
              <RequireAuth>
                <Messages />
              </RequireAuth>
            }
          />

          <Route
            path="/painel"
            element={
              <RequireAuth>
                <FarmerLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="produtos" element={<MyProducts />} />
            <Route path="encomendas" element={<Sales />} />
            <Route path="lavra" element={<MyFarm />} />
            <Route path="monitorizacao" element={<Monitoring />} />
            <Route path="colheitas" element={<Harvests />} />
            <Route path="recomendacoes" element={<Insights />} />
            <Route path="solo" element={<Soil />} />
          </Route>

          <Route
            path="/comprador"
            element={
              <RequireAuth>
                <BuyerDashboard />
              </RequireAuth>
            }
          />

          <Route
            path="/transportador"
            element={
              <RequireAuth>
                <TransporterDashboard />
              </RequireAuth>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="utilizadores" element={<AdminUsers />} />
            <Route path="encomendas" element={<AdminOrders />} />
            <Route path="lavras" element={<AdminFarms />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default App
