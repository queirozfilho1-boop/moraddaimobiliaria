import { Link } from 'react-router-dom'
import SEO from '@/components/common/SEO'

export default function NotFoundPage() {
  return (
    <>
      <SEO title="Página não encontrada" description="A página que você procura não foi encontrada." />
      <div className="min-h-screen pt-24 pb-16 flex items-center">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="font-heading text-8xl font-bold text-moradda-blue-800">404</h1>
          <p className="mt-4 font-body text-xl text-moradda-blue-600">
            Página não encontrada
          </p>
          <p className="mt-2 font-body text-moradda-blue-400">
            A página que você procura não existe ou foi removida.
          </p>
          <Link
            to="/"
            className="mt-8 inline-block rounded-lg bg-moradda-gold-400 px-8 py-3 font-body font-semibold text-white transition-all hover:bg-moradda-gold-500"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </>
  )
}
