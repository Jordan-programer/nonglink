import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { supportedLanguages } from '../i18n'

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)

  const current =
    supportedLanguages.find((l) => l.code === i18n.language) ?? supportedLanguages[0]

  function selectLanguage(code: string) {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-leaf-900 hover:bg-leaf-100"
        aria-label="Change language"
      >
        <Languages size={15} />
        {current.code.toUpperCase()}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-xl border border-leaf-100 bg-white py-1 shadow-lg shadow-leaf-950/10">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => selectLanguage(lang.code)}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-leaf-50 ${
                lang.code === current.code
                  ? 'font-semibold text-leaf-800'
                  : 'text-leaf-950/80'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
