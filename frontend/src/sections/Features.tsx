import { BrainCircuit, Satellite, Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Features() {
  const { t } = useTranslation()

  const features = [
    {
      icon: Store,
      title: t('features.marketplaceTitle'),
      description: t('features.marketplaceDescription'),
      color: 'bg-leaf-100 text-leaf-700',
    },
    {
      icon: Satellite,
      title: t('features.iotTitle'),
      description: t('features.iotDescription'),
      color: 'bg-earth-100 text-earth-700',
    },
    {
      icon: BrainCircuit,
      title: t('features.aiTitle'),
      description: t('features.aiDescription'),
      color: 'bg-leaf-100 text-leaf-700',
    },
  ]

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-leaf-950">
          {t('features.title')}
        </h2>
        <p className="mt-3 text-leaf-950/70">{t('features.subtitle')}</p>
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
