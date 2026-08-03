import { Leaf, ShieldCheck, TrendingUp, Wheat } from 'lucide-react'

const stats = [
  { icon: TrendingUp, label: 'Aumento da renda dos agricultores' },
  { icon: Wheat, label: 'Redução do desperdício pós-colheita' },
  { icon: Leaf, label: 'Melhoria da produtividade agrícola' },
  { icon: ShieldCheck, label: 'Mais segurança alimentar' },
]

export default function Impact() {
  return (
    <section id="impacto" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-leaf-950">
          Impacto real na cadeia de valor agrícola
        </h2>
        <p className="mt-3 text-leaf-950/70">
          Começamos em Angola, com potencial de expansão para toda a África.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-3 rounded-2xl bg-leaf-50 p-6 text-center"
          >
            <div className="rounded-full bg-white p-3 text-leaf-700 shadow-sm">
              <Icon size={22} />
            </div>
            <p className="text-sm font-medium text-leaf-950/80">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
