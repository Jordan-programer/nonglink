import { useTranslation } from 'react-i18next'

export default function PrivacyPolicy() {
  const { t } = useTranslation()
  const sections = t('privacyPolicy.sections', { returnObjects: true }) as {
    heading: string
    body: string[]
  }[]

  return (
    <section className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-leaf-950">
        {t('privacyPolicy.title')}
      </h1>
      <p className="mt-1 text-sm text-leaf-950/50">{t('privacyPolicy.lastUpdated')}</p>
      <p className="mt-6 text-sm leading-relaxed text-leaf-950/80">{t('privacyPolicy.intro')}</p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-base font-semibold text-leaf-950">{section.heading}</h2>
            <div className="mt-3 space-y-3">
              {section.body.map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed text-leaf-950/70">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
