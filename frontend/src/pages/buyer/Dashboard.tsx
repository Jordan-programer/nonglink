import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Package, ShoppingBag, Sprout } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchConversations,
  fetchMyOrders,
  fetchProducts,
  type Conversation,
  type Order,
  type Product,
} from '../../api/client'
import ProductCard from '../../components/ProductCard'
import { STATUS_STYLES, useOrderStatusLabels } from '../../utils/orderStatus'

export default function BuyerDashboard() {
  const { user, token } = useAuth()
  const statusLabels = useOrderStatusLabels()
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  useEffect(() => {
    if (!token) return
    Promise.all([fetchProducts(), fetchMyOrders(token), fetchConversations(token)]).then(
      ([productsRes, ordersRes, conversationsRes]) => {
        setProducts(productsRes)
        setOrders(ordersRes)
        setConversations(conversationsRes)
        setStatus('ready')
      },
    )
  }, [token])

  const pending = orders.filter((o) => o.status === 'pending').length
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unread_count, 0)

  const stats = [
    { icon: ShoppingBag, label: 'Encomendas', value: orders.length },
    { icon: Package, label: 'Pendentes', value: pending },
    { icon: MessageCircle, label: 'Mensagens por ler', value: unreadMessages },
  ]

  if (status === 'loading') {
    return (
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-leaf-50" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-leaf-950">
        Olá, <span className="text-leaf-700">{user?.name.split(' ')[0]}</span>
      </h1>
      <p className="mt-1 text-sm text-leaf-950/60">
        Aqui tens um resumo do que se passa na tua conta AgriLink.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
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

      {/* Product feed */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-leaf-950">Produtos para ti</h2>
          <Link to="/mercado" className="text-sm font-medium text-leaf-700 hover:text-leaf-800">
            Ver mercado
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center text-sm text-leaf-950/60">
            Ainda não há produtos no mercado.
          </div>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Orders overview */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-leaf-950">Encomendas recentes</h2>
            <Link
              to="/minhas-encomendas"
              className="text-sm font-medium text-leaf-700 hover:text-leaf-800"
            >
              Ver todas
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center">
              <Sprout className="text-leaf-700/50" size={24} />
              <p className="text-sm text-leaf-950/60">Ainda não fizeste nenhuma encomenda.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {orders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-2xl border border-leaf-100 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-leaf-950">Encomenda #{order.id}</p>
                    <p className="text-xs text-leaf-950/60">
                      {new Date(order.created_at).toLocaleDateString('pt-AO')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[order.status]}`}
                    >
                      {statusLabels[order.status]}
                    </span>
                    <span className="text-sm font-semibold text-leaf-900">
                      {order.total_amount.toLocaleString('pt-AO')} Kz
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages preview */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-leaf-950">Mensagens</h2>
            <Link to="/mensagens" className="text-sm font-medium text-leaf-700 hover:text-leaf-800">
              Ver todas
            </Link>
          </div>

          {conversations.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center">
              <MessageCircle className="text-leaf-700/50" size={24} />
              <p className="text-sm text-leaf-950/60">Ainda não tens conversas.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {conversations.slice(0, 3).map((c) => (
                <Link
                  key={c.id}
                  to={`/mensagens/${c.id}`}
                  className="flex items-center justify-between rounded-2xl border border-leaf-100 bg-white px-4 py-3 hover:bg-leaf-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-leaf-950">
                      {c.other_user_name}
                    </p>
                    <p className="truncate text-xs text-leaf-950/60">
                      {c.last_message ?? 'Sem mensagens'}
                    </p>
                  </div>
                  {c.unread_count > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-leaf-700 px-1 text-[11px] font-bold text-white">
                      {c.unread_count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
