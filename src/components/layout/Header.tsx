import { useState, useEffect, useCallback } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import logo from '@/assets/images/logo.png'

const navLinks = [
  { to: '/', label: 'Início' },
  { to: '/imoveis', label: 'Imóveis' },
  { to: '/sobre', label: 'Sobre' },
  { to: '/equipe', label: 'Equipe' },
  { to: '/blog', label: 'Blog' },
  { to: '/contato', label: 'Contato' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const handleNavClick = useCallback((e: React.MouseEvent, to: string) => {
    e.preventDefault()
    setMobileOpen(false)
    if (location.pathname === to) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate(to)
      window.scrollTo(0, 0)
    }
  }, [location.pathname, navigate])

  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setMobileOpen(false)
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate('/')
      window.scrollTo(0, 0)
    }
  }, [location.pathname, navigate])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <a href="/" onClick={handleLogoClick} className="flex-shrink-0">
            <img
              src={logo}
              alt="Moradda Imobiliária"
              className={`h-12 w-auto transition-all duration-500 ${!scrolled ? 'brightness-0 invert' : ''}`}
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={(e) => handleNavClick(e, link.to)}
                className={({ isActive }) =>
                  `font-body text-sm font-medium transition-colors duration-300 hover:text-moradda-gold-400 ${
                    isActive
                      ? 'text-moradda-gold-400'
                      : scrolled
                        ? 'text-moradda-blue-800'
                        : 'text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {/* Painel — link real (outra app) */}
            <a
              href={import.meta.env.DEV ? 'http://localhost:5002/painel/' : '/painel/'}
              className={`font-body text-sm font-medium transition-colors duration-300 hover:text-moradda-gold-400 ${
                scrolled ? 'text-moradda-blue-800' : 'text-white'
              }`}
            >
              Painel
            </a>
          </nav>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-4">
            <a
              href="/vender"
              onClick={(e) => handleNavClick(e, '/vender')}
              className="hidden rounded-lg bg-moradda-gold-400 px-6 py-2.5 font-body text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-moradda-gold-500 hover:shadow-lg sm:inline-flex"
            >
              Anuncie seu Imóvel
            </a>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`inline-flex items-center justify-center rounded-md p-2 transition-colors lg:hidden ${
                scrolled ? 'text-moradda-blue-800 hover:bg-moradda-blue-50' : 'text-white hover:bg-white/10'
              }`}
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 top-0 z-40 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <img src={logo} alt="Moradda Imobiliária" className="h-10 w-auto" />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md p-2 text-moradda-blue-800 transition-colors hover:bg-moradda-blue-50"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                  >
                    <NavLink
                      to={link.to}
                      end={link.to === '/'}
                      onClick={(e) => handleNavClick(e, link.to)}
                      className={({ isActive }) =>
                        `block rounded-lg px-4 py-3 font-body text-base font-medium transition-colors ${
                          isActive
                            ? 'bg-moradda-blue-50 text-moradda-gold-400'
                            : 'text-moradda-blue-800 hover:bg-moradda-blue-50'
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}
                {/* Painel no mobile */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.05 + 0.1 }}
                >
                  <a
                    href={import.meta.env.DEV ? 'http://localhost:5002/painel/' : '/painel/'}
                    className="block rounded-lg px-4 py-3 font-body text-base font-medium text-moradda-blue-800 hover:bg-moradda-blue-50 transition-colors"
                  >
                    Painel
                  </a>
                </motion.div>
              </nav>

              <div className="border-t border-gray-100 px-6 py-5">
                <a
                  href="/vender"
                  onClick={(e) => handleNavClick(e, '/vender')}
                  className="block w-full rounded-lg bg-moradda-gold-400 px-6 py-3 text-center font-body text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-moradda-gold-500"
                >
                  Anuncie seu Imóvel
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
