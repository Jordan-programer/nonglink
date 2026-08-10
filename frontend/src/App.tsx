import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import RequireAuth from './components/RequireAuth'
import RequireAdmin from './components/RequireAdmin'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import ProductDetail from './pages/ProductDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Orders from './pages/Orders'
import Messages from './pages/Messages'
import FarmerLayout from './pages/farmer/FarmerLayout'
import Dashboard from './pages/farmer/Dashboard'
import MyFarm from './pages/farmer/MyFarm'
import MyProducts from './pages/farmer/MyProducts'
import Sales from './pages/farmer/Sales'
import Monitoring from './pages/farmer/Monitoring'
import Harvests from './pages/farmer/Harvests'
import Insights from './pages/farmer/Insights'
import BuyerDashboard from './pages/buyer/Dashboard'
import TransporterDashboard from './pages/transporter/Dashboard'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminOrders from './pages/admin/Orders'
import AdminFarms from './pages/admin/Farms'

function App() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mercado" element={<Marketplace />} />
          <Route path="/mercado/:id" element={<ProductDetail />} />
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
