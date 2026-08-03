import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import RequireAuth from './components/RequireAuth'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import ProductDetail from './pages/ProductDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import FarmerLayout from './pages/farmer/FarmerLayout'
import Dashboard from './pages/farmer/Dashboard'
import MyFarm from './pages/farmer/MyFarm'
import MyProducts from './pages/farmer/MyProducts'
import Sales from './pages/farmer/Sales'

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
          </Route>
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default App
