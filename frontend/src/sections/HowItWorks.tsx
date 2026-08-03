const steps = [
  {
    number: '01',
    title: 'Sensores instalados na lavra',
    description: 'Equipamento IoT de baixo custo é colocado no terreno do agricultor.',
  },
  {
    number: '02',
    title: 'Dados enviados para a plataforma',
    description: 'Leituras de humidade, temperatura e água chegam em tempo real.',
  },
  {
    number: '03',
    title: 'Sistema processa a informação',
    description: 'Algoritmos analisam os dados e cruzam com o histórico da lavra.',
  },
  {
    number: '04',
    title: 'Agricultor recebe recomendações',
    description: 'Alertas de irrigação e previsões de produção chegam ao telemóvel.',
  },
  {
    number: '05',
    title: 'Produtos vendidos no marketplace',
    description: 'A colheita é anunciada e vendida direto a compradores.',
  },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-leaf-950 py-20 text-cream-50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Como funciona
          </h2>
          <p className="mt-3 text-cream-100/70">
            Tudo num único sistema — da sensorização à venda.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-5">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              <p className="text-3xl font-bold text-leaf-500">{step.number}</p>
              <h3 className="mt-3 text-base font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-cream-100/60">
                {step.description}
              </p>
              {i < steps.length - 1 && (
                <div
                  className="absolute right-0 top-4 hidden h-px w-full max-w-[80%] -translate-y-1/2 translate-x-1/2 bg-leaf-700/60 md:block"
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
