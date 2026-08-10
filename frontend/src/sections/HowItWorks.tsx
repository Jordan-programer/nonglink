import { useTranslation } from 'react-i18next'

export default function HowItWorks() {
  const { t } = useTranslation()

  const steps = [
    { number: '01', title: t('howItWorks.step1Title'), description: t('howItWorks.step1Description') },
    { number: '02', title: t('howItWorks.step2Title'), description: t('howItWorks.step2Description') },
    { number: '03', title: t('howItWorks.step3Title'), description: t('howItWorks.step3Description') },
    { number: '04', title: t('howItWorks.step4Title'), description: t('howItWorks.step4Description') },
    { number: '05', title: t('howItWorks.step5Title'), description: t('howItWorks.step5Description') },
  ]

  return (
    <section id="como-funciona" className="bg-leaf-950 py-20 text-cream-50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            {t('howItWorks.title')}
          </h2>
          <p className="mt-3 text-cream-100/70">{t('howItWorks.subtitle')}</p>
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
