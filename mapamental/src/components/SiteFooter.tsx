import logoMoradda from "@/assets/logo.png";

export function SiteFooter() {
  return (
    <footer className="bg-moradda-azul text-white/70">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-3">
          <img src={logoMoradda} alt="Moradda Imobiliária" className="h-9 w-auto brightness-0 invert" />
          <div className="text-xs">Guia interno da equipe</div>
        </div>
        <div className="text-xs">Tem dúvida? Pergunte para qualquer pessoa do time. A gente te ajuda.</div>
      </div>
    </footer>
  );
}
