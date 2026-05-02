import SEO from '@/components/common/SEO'
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
        title="Imóveis Premium em Resende e Região"
        description="Encontre imóveis de alto padrão em Resende e região com a Moradda Imobiliária. Casas, apartamentos e terrenos com atendimento exclusivo e personalizado."
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
