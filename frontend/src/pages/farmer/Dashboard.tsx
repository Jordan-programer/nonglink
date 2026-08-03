import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingBag, Sprout, Wallet } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchMyFarms,
  fetchMyProducts,
  fetchSales,
  type Farm,
  type Product,
  type Sale,
} from '../../api/client'

export default function Dashboard() {
  const { user, token } = useAuth()
  const [farms, setFarms] = useState<Farm[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  useEffect(() => {
    if (!token) return
    Promise.all([fetchMyFarms(token), fetchMyProducts(token), fetchSales(token)]).then(
      ([farmsRes, productsRes, salesRes]) => {
        setFarms(farmsRes)
        setProducts(productsRes)
        setSales(salesRes)
        setStatus('ready')
      },
    )
  }, [token])

  const revenue = sales.reduce((sum, s) => sum + s.quantity * s.unit_price, 0)
  const pending = sales.filter((s) => s.status === 'pending').length

  const stats = [
    { icon: Sprout, label: 'Lavras', value: farms.length },
    { icon: Package, label: 'Produtos ativos', value: products.length },
    { icon: ShoppingBag, label: 'Encomendas pendentes', value: pending },
    {
      icon: Wallet,
      label: 'Receita total',
      value: `${revenue.toLocaleString('pt-AO')} Kz`,
    },
  ]

  if (status === 'loading') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-leaf-50" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-leaf-950/60">
        Bem-vindo de volta, <span className="font-medium text-leaf-900">{user?.name}</span>.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-leaf-100 bg-white p-5">
            <div className="inline-flex rounded-xl bg-leaf-100 p-2.5 text-leaf-700">
              <Icon size={18} />
            </div>
            <p className="mt-3 text-2xl font-semibold text-leaf-950">{value}</p>
            <p className="text-sm text-leaf-950/60">{label}</p>
          </div>
        ))}
      </div>

      {farms.length === 0 && (
        <div className="mt-6 rounded-2xl border border-earth-200 bg-earth-50 p-6 text-earth-800">
          <p className="font-medium">Cria a tua lavra para começares a vender.</p>
          <Link
            to="/painel/lavra"
            className="mt-3 inline-flex rounded-full bg-earth-600 px-5 py-2 text-sm font-semibold text-white hover:bg-earth-700"
          >
            Criar lavra
          </Link>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-leaf-950">Encomendas recentes</h2>
          <Link
            to="/painel/encomendas"
            className="text-sm font-medium text-leaf-700 hover:text-leaf-800"
          >
            Ver todas
          </Link>
        </div>

        {sales.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center text-sm text-leaf-950/60">
            Ainda não recebeste encomendas.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {sales.slice(0, 5).map((sale) => (
              <div
                key={sale.order_item_id}
                className="flex items-center justify-between rounded-2xl border border-leaf-100 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-leaf-950">{sale.product_name}</p>
                  <p className="text-xs text-leaf-950/60">
                    {sale.buyer_name} · {sale.quantity} un.
                  </p>
                </div>
                <p className="text-sm font-semibold text-leaf-900">
                  {(sale.quantity * sale.unit_price).toLocaleString('pt-AO')} Kz
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
