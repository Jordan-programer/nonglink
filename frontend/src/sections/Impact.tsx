import { Leaf, ShieldCheck, TrendingUp, Wheat } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Impact() {
  const { t } = useTranslation()

  const stats = [
    { icon: TrendingUp, label: t('impact.income') },
    { icon: Wheat, label: t('impact.waste') },
    { icon: Leaf, label: t('impact.productivity') },
    { icon: ShieldCheck, label: t('impact.foodSecurity') },
  ]

  return (
    <section id="impacto" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-leaf-950">
          {t('impact.title')}
        </h2>
        <p className="mt-3 text-leaf-950/70">{t('impact.subtitle')}</p>
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
