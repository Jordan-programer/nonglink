import { BrainCircuit, Satellite, Store } from 'lucide-react'

const features = [
  {
    icon: Store,
    title: 'Marketplace agrícola',
    description:
      'Vende diretamente a compradores, distribuidores e consumidores, sem passar por intermediários.',
    color: 'bg-leaf-100 text-leaf-700',
  },
  {
    icon: Satellite,
    title: 'Monitorização IoT',
    description:
      'Sensores de baixo custo medem humidade do solo, temperatura, nível de água e condições ambientais em tempo real.',
    color: 'bg-earth-100 text-earth-700',
  },
  {
    icon: BrainCircuit,
    title: 'Apoio inteligente à decisão',
    description:
      'A plataforma analisa os dados recolhidos e sugere quando irrigar, alerta sobre riscos e prevê a produção.',
    color: 'bg-leaf-100 text-leaf-700',
  },
]

export default function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-leaf-950">
          Um ecossistema completo, não só uma ferramenta
        </h2>
        <p className="mt-3 text-leaf-950/70">
          Diferente de soluções que resolvem apenas uma parte do problema, o
          AgriLink integra venda, monitorização e inteligência de dados numa
          única plataforma acessível.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {features.map(({ icon: Icon, title, description, color }) => (
          <div
            key={title}
            className="rounded-2xl border border-leaf-100 bg-white p-7 shadow-sm shadow-leaf-950/5 transition-shadow hover:shadow-md"
          >
            <div className={`inline-flex rounded-xl p-3 ${color}`}>
              <Icon size={22} />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-leaf-950">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-leaf-950/70">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
