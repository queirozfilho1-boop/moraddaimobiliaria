
import SEO from '@/components/common/SEO'

export default function ConfirmacaoPage() {
  return (
    <>
      <SEO title="E-mail Confirmado" description="Seu e-mail foi confirmado com sucesso." />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-moradda-blue-800 to-moradda-blue-900 px-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl bg-white p-10 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-6 font-heading text-2xl font-bold text-moradda-blue-800">
              E-mail Confirmado!
            </h1>
            <p className="mt-3 font-body text-gray-500">
              Seu e-mail foi confirmado com sucesso. Agora você pode acessar o painel da Moradda Imobiliária.
            </p>
            <a
              href="/painel/"
              className="mt-8 inline-block rounded-xl bg-moradda-blue-500 px-8 py-3 font-body text-sm font-semibold text-white shadow-md transition-all hover:bg-moradda-blue-600"
            >
              Acessar o Painel
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
