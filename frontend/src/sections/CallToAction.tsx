import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function CallToAction() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="relative overflow-hidden rounded-3xl bg-leaf-700 px-8 py-14 text-center text-white sm:px-16">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-leaf-500/40 blur-3xl"
          aria-hidden
        />
        <h2 className="text-3xl font-semibold tracking-tight">
          Pronto para vender direto e cultivar com dados?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-leaf-50/90">
          Junta-te aos agricultores que já usam o AgriLink para chegar a mais
          compradores e cuidar melhor das suas lavras.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/mercado"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-leaf-800 hover:bg-cream-50"
          >
            Começar agora
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
