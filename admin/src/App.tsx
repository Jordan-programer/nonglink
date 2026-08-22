import { Route, Routes } from 'react-router-dom'
import RequireAdmin from './components/RequireAdmin'
import AdminLogin from './pages/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminOrders from './pages/admin/Orders'
import AdminFarms from './pages/admin/Farms'

function App() {
  return (
    <main className="flex-1">
      <Routes>
        <Route path="/entrar" element={<AdminLogin />} />
        <Route
          path="/"
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
  )
}

export default App
