import SEO from '@/components/common/SEO'
import { JSONLD_IMOBILIARIA } from '@/lib/constants'
import HeroSection from '@/components/sections/HeroSection'
import BannersSection from '@/components/sections/BannersSection'
import ImoveisDestaqueSection from '@/components/sections/ImoveisDestaqueSection'
import DiferenciaisSection from '@/components/sections/DiferenciaisSection'
import BairrosSection from '@/components/sections/BairrosSection'
import GrupoAlfaconSection from '@/components/sections/GrupoAlfaconSection'
import DepoimentosSection from '@/components/sections/DepoimentosSection'
import BlogPreviewSection from '@/components/sections/BlogPreviewSection'
import CTASection from '@/components/sections/CTASection'

export default function HomePage() {
  return (
    <>
      <SEO
        title="Imóveis à venda e para alugar em Resende e Itatiaia - RJ"
        description="Casas, apartamentos, terrenos e pontos comerciais em Resende e Itatiaia/RJ. Compra, venda, locação e administração de imóveis com atendimento especializado. Moradda Imobiliária, CRECI-PJ RJ 10404."
        jsonLd={JSONLD_IMOBILIARIA}
      />
      <HeroSection />
      <BannersSection />
      <ImoveisDestaqueSection />
      <DiferenciaisSection />
      <BairrosSection />
      <GrupoAlfaconSection />
      <DepoimentosSection />
      <BlogPreviewSection />
      <CTASection />
    </>
  )
}
