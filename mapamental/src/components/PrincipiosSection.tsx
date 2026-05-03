import { Heart, Eye, Sparkles } from "lucide-react";

const PRINCIPIOS = [
  {
    icone: Heart,
    titulo: "Cliente é só um",
    texto: "A mesma pessoa pode ser locatário, comprador e proprietário. Sempre busque pelo CPF antes de cadastrar.",
  },
  {
    icone: Eye,
    titulo: "Tudo deixa rastro",
    texto: "Cada visita, contrato e cobrança fica registrada. Se aconteceu, está no sistema.",
  },
  {
    icone: Sparkles,
    titulo: "O sistema faz o trabalho chato",
    texto: "Cobranças mensais, marca d'água, comissão da venda, evento no Google — tudo automático.",
  },
];

export function PrincipiosSection() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="max-w-2xl">
        <div className="text-sm uppercase tracking-widest text-c-dourado-text font-semibold">Antes de começar</div>
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold mt-2">
          Três coisas que você precisa entender
        </h2>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
        {PRINCIPIOS.map((p, i) => {
          const Icon = p.icone;
          return (
            <div
              key={i}
              className="rounded-2xl bg-card border border-border p-6 hover:border-c-dourado/40 transition-colors animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-secondary border border-c-dourado/30">
                <Icon className="h-5 w-5 text-c-dourado-text" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-semibold">{p.titulo}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{p.texto}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
