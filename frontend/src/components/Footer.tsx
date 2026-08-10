import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-leaf-100 bg-leaf-950 text-cream-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2 font-semibold text-white">
            <Logo className="h-8 w-8 rounded-lg" />
            <span className="text-lg tracking-tight">AgriLink</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-cream-100/70">{t('footer.tagline')}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">{t('footer.platform')}</h3>
          <ul className="mt-4 space-y-2 text-sm text-cream-100/70">
            <li><Link to="/mercado" className="hover:text-white">{t('footer.agriculturalMarket')}</Link></li>
            <li><a href="/#como-funciona" className="hover:text-white">{t('footer.howItWorks')}</a></li>
            <li><a href="/#impacto" className="hover:text-white">{t('footer.impact')}</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">{t('footer.forFarmers')}</h3>
          <ul className="mt-4 space-y-2 text-sm text-cream-100/70">
            <li><a href="#" className="hover:text-white">{t('footer.sellProducts')}</a></li>
            <li><a href="#" className="hover:text-white">{t('footer.sensorKits')}</a></li>
            <li><a href="#" className="hover:text-white">{t('footer.cooperatives')}</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">{t('footer.contact')}</h3>
          <ul className="mt-4 space-y-2 text-sm text-cream-100/70">
            <li>{t('footer.location')}</li>
            <li>contacto@agrilink.ao</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-cream-100/50">
        {t('footer.rights', { year: new Date().getFullYear() })}
      </div>
    </footer>
  )
}
