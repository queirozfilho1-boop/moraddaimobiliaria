import { Compass } from "lucide-react";
import logoMoradda from "@/assets/logo.png";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-moradda-azul via-moradda-azul-claro to-moradda-azul text-white">
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />
      <div className="relative max-w-6xl mx-auto px-6 py-20 sm:py-28">
        <img
          src={logoMoradda}
          alt="Moradda Imobiliária"
          className="mb-8 h-14 w-auto brightness-0 invert"
        />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-sm">
          <Compass className="h-4 w-4 text-moradda-dourado" />
          <span className="font-medium">Guia rápido para a equipe</span>
        </div>
        <h1 className="mt-5 font-serif text-4xl sm:text-6xl font-semibold leading-tight max-w-3xl">
          Bem-vindo à <span className="text-moradda-dourado">Moradda</span>.
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-white/85 max-w-2xl leading-relaxed">
          Aqui você descobre, em poucos minutos, como funciona o nosso sistema —
          quais áreas existem e qual é o passo a passo do que a gente faz no dia a dia.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#fluxos" className="px-5 py-3 rounded-full bg-moradda-dourado text-moradda-azul font-semibold hover:opacity-90 transition">
            Ver os fluxos →
          </a>
          <a href="#areas" className="px-5 py-3 rounded-full bg-white/10 backdrop-blur border border-white/25 text-white font-medium hover:bg-white/15 transition">
            Conhecer as áreas
          </a>
        </div>
      </div>
    </section>
  );
}
