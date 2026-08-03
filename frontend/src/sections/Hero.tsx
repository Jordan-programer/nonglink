import { Link } from 'react-router-dom'
import { ArrowRight, Droplets, Sprout, Thermometer } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-leaf-50 to-cream-50">
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-leaf-200/50 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-earth-200/50 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-leaf-100 px-4 py-1.5 text-sm font-medium text-leaf-800">
            <Sprout size={16} /> AgriTech feita para Angola
          </span>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-leaf-950 sm:text-5xl">
            Da lavra ao mercado,{' '}
            <span className="text-leaf-600">sem intermediários.</span>
          </h1>

          <p className="mt-5 max-w-lg text-lg text-leaf-950/70">
            AgriLink liga agricultores diretamente a compradores, monitoriza
            as suas lavras com sensores IoT e usa dados para recomendar a
            melhor altura de irrigar, colher e vender.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/mercado"
              className="inline-flex items-center gap-2 rounded-full bg-leaf-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-leaf-700/25 transition-colors hover:bg-leaf-800"
            >
              Explorar o mercado
              <ArrowRight size={16} />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 rounded-full border border-leaf-300 px-6 py-3 text-sm font-semibold text-leaf-900 hover:bg-leaf-100"
            >
              Como funciona
            </a>
          </div>

          <div className="mt-10 flex gap-8 text-sm text-leaf-950/60">
            <div>
              <p className="text-2xl font-semibold text-leaf-900">+30%</p>
              <p>rendimento estimado</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-leaf-900">-25%</p>
              <p>desperdício pós-colheita</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-leaf-900">24/7</p>
              <p>monitorização das lavras</p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-leaf-100 bg-white/80 p-6 shadow-xl shadow-leaf-950/10 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-leaf-950/60">
                Quinta do João · Huambo
              </p>
              <span className="flex items-center gap-1 rounded-full bg-leaf-100 px-2.5 py-1 text-xs font-medium text-leaf-700">
                <span className="h-1.5 w-1.5 rounded-full bg-leaf-500" />
                ao vivo
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-leaf-50 p-4">
                <Droplets className="text-leaf-600" size={20} />
                <p className="mt-3 text-2xl font-semibold text-leaf-950">62%</p>
                <p className="text-xs text-leaf-950/60">Humidade do solo</p>
              </div>
              <div className="rounded-2xl bg-earth-50 p-4">
                <Thermometer className="text-earth-600" size={20} />
                <p className="mt-3 text-2xl font-semibold text-leaf-950">27°C</p>
                <p className="text-xs text-leaf-950/60">Temperatura</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-leaf-700">
                Recomendação de hoje
              </p>
              <p className="mt-1 text-sm text-leaf-950/80">
                Solo com humidade adequada — não é necessário irrigar nas
                próximas 24h.
              </p>
            </div>
          </div>

          <div className="absolute -bottom-6 -right-6 rounded-2xl bg-earth-500 px-5 py-4 text-white shadow-lg shadow-earth-500/30">
            <p className="text-xs font-medium text-earth-50">Milho · 250 Kz/kg</p>
            <p className="text-lg font-semibold">500 kg disponíveis</p>
          </div>
        </div>
      </div>
    </section>
  )
}
