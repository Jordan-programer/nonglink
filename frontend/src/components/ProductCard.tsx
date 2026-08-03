import { Leaf } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Product } from '../api/client'

const TILE_COLORS = [
  'from-leaf-400 to-leaf-600',
  'from-earth-400 to-earth-600',
  'from-leaf-500 to-leaf-700',
]

function tileColor(id: number) {
  return TILE_COLORS[id % TILE_COLORS.length]
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/mercado/${product.id}`}
      className="group block overflow-hidden rounded-2xl border border-leaf-100 bg-white shadow-sm shadow-leaf-950/5 transition-shadow hover:shadow-md"
    >
      <div
        className={`flex h-32 items-center justify-center bg-gradient-to-br ${tileColor(
          product.id,
        )}`}
      >
        <Leaf className="text-white/90" size={32} />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-leaf-950">{product.name}</h3>
          {product.category && (
            <span className="whitespace-nowrap rounded-full bg-leaf-100 px-2.5 py-0.5 text-xs font-medium text-leaf-700">
              {product.category}
            </span>
          )}
        </div>

        {product.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-leaf-950/60">
            {product.description}
          </p>
        )}

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-lg font-semibold text-leaf-900">
              {product.price_per_unit.toLocaleString('pt-AO')} Kz
              <span className="text-sm font-normal text-leaf-950/50">
                {' '}
                / {product.unit}
              </span>
            </p>
            <p className="text-xs text-leaf-950/50">
              {product.quantity_available} {product.unit} disponíveis
            </p>
          </div>
          <span className="rounded-full bg-leaf-700 px-4 py-2 text-xs font-semibold text-white group-hover:bg-leaf-800">
            Ver detalhes
          </span>
        </div>
      </div>
    </Link>
  )
}
