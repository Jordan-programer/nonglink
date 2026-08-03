import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="border-t border-leaf-100 bg-leaf-950 text-cream-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2 font-semibold text-white">
            <Logo className="h-8 w-8 rounded-lg" />
            <span className="text-lg tracking-tight">AgriLink</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-cream-100/70">
            Marketplace, monitorização IoT e dados inteligentes para uma
            agricultura mais justa e produtiva em Angola.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Plataforma</h3>
          <ul className="mt-4 space-y-2 text-sm text-cream-100/70">
            <li><Link to="/mercado" className="hover:text-white">Mercado agrícola</Link></li>
            <li><a href="/#como-funciona" className="hover:text-white">Como funciona</a></li>
            <li><a href="/#impacto" className="hover:text-white">Impacto</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Para agricultores</h3>
          <ul className="mt-4 space-y-2 text-sm text-cream-100/70">
            <li><a href="#" className="hover:text-white">Vender produtos</a></li>
            <li><a href="#" className="hover:text-white">Kits de sensores IoT</a></li>
            <li><a href="#" className="hover:text-white">Cooperativas</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Contacto</h3>
          <ul className="mt-4 space-y-2 text-sm text-cream-100/70">
            <li>Luanda, Angola</li>
            <li>contacto@agrilink.ao</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-cream-100/50">
        © {new Date().getFullYear()} AgriLink. Todos os direitos reservados.
      </div>
    </footer>
  )
}
