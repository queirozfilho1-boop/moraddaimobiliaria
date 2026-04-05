import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react'
import logo from '@/assets/images/logo.png'

const SocialIcon = ({ type }: { type: string }) => {
  if (type === 'instagram') return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  )
  if (type === 'facebook') return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  )
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  )
}

const socialLinks = [
  { href: 'https://instagram.com/moraddaimobiliaria/', type: 'instagram', label: 'Instagram' },
  { href: 'https://facebook.com/moraddaimobiliaria', type: 'facebook', label: 'Facebook' },
]

const imoveisLinks = [
  { to: '/imoveis?tipo=casa', label: 'Casas' },
  { to: '/imoveis?tipo=apartamento', label: 'Apartamentos' },
  { to: '/imoveis?tipo=terreno', label: 'Terrenos' },
  { to: '/imoveis?tipo=comercial', label: 'Comerciais' },
]

const institucionalLinks = [
  { to: '/sobre', label: 'Sobre' },
  { to: '/equipe', label: 'Equipe' },
  { to: '/blog', label: 'Blog' },
  { to: '/contato', label: 'Contato' },
]

export default function Footer() {
  return (
    <footer className="bg-moradda-blue-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1 — Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block">
              <img
                src={logo}
                alt="Moradda Imobiliária"
                className="h-12 w-auto brightness-0 invert"
              />
            </Link>
            <p className="mt-4 font-body text-sm leading-relaxed text-moradda-blue-200">
              Encontre o imóvel dos seus sonhos com a Moradda Imobiliária.
              Experiência, confiança e atendimento personalizado para realizar
              o seu próximo grande passo.
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-moradda-blue-700 text-moradda-blue-300 transition-all duration-300 hover:border-moradda-gold-400 hover:bg-moradda-gold-400 hover:text-white"
                >
                  <SocialIcon type={social.type} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 — Imóveis */}
          <div>
            <h3 className="font-heading text-lg font-semibold text-moradda-gold-400">
              Imóveis
            </h3>
            <ul className="mt-4 space-y-3">
              {imoveisLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="font-body text-sm text-moradda-blue-200 transition-colors duration-300 hover:text-moradda-gold-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Institucional */}
          <div>
            <h3 className="font-heading text-lg font-semibold text-moradda-gold-400">
              Institucional
            </h3>
            <ul className="mt-4 space-y-3">
              {institucionalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="font-body text-sm text-moradda-blue-200 transition-colors duration-300 hover:text-moradda-gold-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Contato */}
          <div>
            <h3 className="font-heading text-lg font-semibold text-moradda-gold-400">
              Contato
            </h3>
            <ul className="mt-4 space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-moradda-gold-400" />
                <a
                  href="tel:+5524998571528"
                  className="font-body text-sm text-moradda-blue-200 transition-colors hover:text-moradda-gold-400"
                >
                  (24) 99857-1528
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-moradda-gold-400" />
                <a
                  href="mailto:contato@moraddaimobiliaria.com.br"
                  className="font-body text-sm text-moradda-blue-200 transition-colors hover:text-moradda-gold-400"
                >
                  contato@moraddaimobiliaria.com.br
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-moradda-gold-400" />
                <span className="font-body text-sm text-moradda-blue-200">
                  Rua Dom Bosco, nº 165 — Paraíso
                  <br />
                  Resende — RJ, 27541-140
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-moradda-gold-400" />
                <a
                  href="https://wa.me/5524998571528"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-sm text-moradda-blue-200 transition-colors hover:text-moradda-gold-400"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Gold Separator */}
        <div className="my-10 h-px bg-gradient-to-r from-transparent via-moradda-gold-400 to-transparent" />

        {/* Grupo Alfacon */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <p className="font-body text-xs font-medium uppercase tracking-widest text-moradda-gold-400">
            Grupo Alfacon
          </p>
          <div className="flex items-center gap-6">
            <span className="font-body text-sm text-moradda-blue-200">Moradda Imobiliaria</span>
            <span className="h-4 w-px bg-moradda-blue-700" />
            <a
              href="https://contabilidadealfacon.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-sm text-moradda-blue-200 transition-colors hover:text-moradda-gold-400"
            >
              Alfacon Contabilidade
            </a>
          </div>
          <p className="font-body text-xs text-moradda-blue-400">
            Solidez e confianca ha mais de 10 anos
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="font-body text-xs text-moradda-blue-300">
            &copy; 2025 Moradda Imobiliária. Todos os direitos reservados. CRECI-RJ 10404
          </p>
          <Link
            to="/politica-de-privacidade"
            className="font-body text-xs text-moradda-blue-300 transition-colors hover:text-moradda-gold-400"
          >
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  )
}
