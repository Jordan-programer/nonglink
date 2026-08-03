import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { fetchSales, type Sale } from '../../api/client'

const STATUS_LABELS: Record<Sale['status'], string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  shipped: 'Enviada',
  delivered: 'Entregue',
  cancelled: 'Cancelada',
}

const STATUS_STYLES: Record<Sale['status'], string> = {
  pending: 'bg-earth-100 text-earth-700',
  confirmed: 'bg-leaf-100 text-leaf-700',
  shipped: 'bg-leaf-100 text-leaf-700',
  delivered: 'bg-leaf-200 text-leaf-800',
  cancelled: 'bg-red-100 text-red-700',
}

export default function Sales() {
  const { token } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  useEffect(() => {
    if (!token) return
    fetchSales(token).then((data) => {
      setSales(data)
      setStatus('ready')
    })
  }, [token])

  if (status === 'loading') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-leaf-50" />
        ))}
      </div>
    )
  }

  if (sales.length === 0) {
    return (
      <div className="rounded-2xl border border-leaf-100 bg-leaf-50 p-10 text-center text-sm text-leaf-950/60">
        Ainda não recebeste encomendas.
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-leaf-950">Encomendas recebidas</h2>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-leaf-100 bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-leaf-100 text-xs font-medium uppercase tracking-wide text-leaf-950/50">
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Comprador</th>
              <th className="px-4 py-3">Quantidade</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.order_item_id} className="border-b border-leaf-50 last:border-0">
                <td className="px-4 py-3 font-medium text-leaf-950">{sale.product_name}</td>
                <td className="px-4 py-3 text-leaf-950/70">{sale.buyer_name}</td>
                <td className="px-4 py-3 text-leaf-950/70">{sale.quantity}</td>
                <td className="px-4 py-3 font-medium text-leaf-950">
                  {(sale.quantity * sale.unit_price).toLocaleString('pt-AO')} Kz
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[sale.status]}`}
                  >
                    {STATUS_LABELS[sale.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-leaf-950/60">
                  {new Date(sale.created_at).toLocaleDateString('pt-AO')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
