import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { fetchProducts, type Product } from '../api/client'
import ProductCard from '../components/ProductCard'

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchProducts()
      .then((data) => {
        if (!cancelled) {
          setProducts(data)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[],
    [products],
  )

  const filtered = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = !category || p.category === category
    return matchesQuery && matchesCategory
  })

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-leaf-950">
          Mercado agrícola
        </h1>
        <p className="mt-2 text-leaf-950/70">
          Produtos frescos vendidos diretamente por agricultores em Angola,
          sem intermediários.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leaf-950/40"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Procurar produtos..."
            className="w-full rounded-full border border-leaf-200 bg-white py-2.5 pl-9 pr-4 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory(null)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                category === null
                  ? 'bg-leaf-700 text-white'
                  : 'bg-leaf-100 text-leaf-700 hover:bg-leaf-200'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                  category === cat
                    ? 'bg-leaf-700 text-white'
                    : 'bg-leaf-100 text-leaf-700 hover:bg-leaf-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        {status === 'loading' && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border border-leaf-100 bg-leaf-50"
              />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-earth-200 bg-earth-50 p-6 text-center text-earth-800">
            Não foi possível carregar os produtos. Verifica se o backend está
            a correr em <code className="font-mono">http://localhost:8000</code>.
          </div>
        )}

        {status === 'ready' && filtered.length === 0 && (
          <div className="rounded-2xl border border-leaf-100 bg-leaf-50 p-10 text-center text-leaf-950/60">
            Nenhum produto encontrado.
          </div>
        )}

        {status === 'ready' && filtered.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
