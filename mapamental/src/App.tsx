import { HeroSection } from '@/components/HeroSection'
import { PrincipiosSection } from '@/components/PrincipiosSection'
import { FluxosSection } from '@/components/FluxosSection'
import { AreaGrid } from '@/components/AreaGrid'
import { SiteFooter } from '@/components/SiteFooter'

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <PrincipiosSection />
      <FluxosSection />
      <AreaGrid />
      <SiteFooter />
    </div>
  )
}
