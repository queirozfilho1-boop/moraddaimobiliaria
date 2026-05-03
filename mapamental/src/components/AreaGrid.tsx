import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2, Lightbulb } from "lucide-react";
import { AREAS, COR_BG, COR_BORDER, COR_GRAD, type AreaCard } from "@/data/moradda-simple";

export function AreaGrid() {
  const [open, setOpen] = useState<AreaCard | null>(null);

  return (
    <section id="areas" className="max-w-6xl mx-auto px-6 py-20">
      <div className="max-w-2xl">
        <div className="text-sm uppercase tracking-widest text-c-dourado-text font-semibold">As áreas</div>
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold mt-2">
          O que existe no nosso sistema
        </h2>
        <p className="mt-3 text-muted-foreground text-lg">
          Cada cartão é uma área do painel. Clique para entender o que ela faz e quando você vai usar.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AREAS.map((a, i) => {
          const Icon = a.icone;
          return (
            <button
              key={a.id}
              onClick={() => setOpen(a)}
              className={`group text-left rounded-2xl border bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 ${COR_BORDER[a.cor]} animate-fade-up`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl ${COR_BG[a.cor]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-semibold text-lg text-foreground group-hover:text-c-dourado-text transition-colors">
                {a.nome}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{a.resumo}</p>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            className="fixed inset-0 z-40 bg-moradda-azul/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-3xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              <div className={`bg-gradient-to-br ${COR_GRAD[open.cor]} p-6 text-white relative`}>
                <button
                  onClick={() => setOpen(null)}
                  className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/15 hover:bg-white/25 inline-flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white/15 backdrop-blur">
                  <open.icone className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-serif text-2xl sm:text-3xl font-semibold">{open.nome}</h3>
                <p className="mt-2 text-white/90">{open.oQueE}</p>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <div className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">
                    Como funciona
                  </div>
                  <ul className="space-y-2.5">
                    {open.comoFunciona.map((c, i) => (
                      <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                        <CheckCircle2 className="h-5 w-5 text-c-verde shrink-0 mt-0.5" />
                        <span className="text-foreground/90">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {open.dicas && open.dicas.length > 0 && (
                  <div className="rounded-xl bg-secondary p-4 border border-c-dourado/20">
                    <div className="flex items-center gap-2 text-c-dourado-text font-semibold text-sm mb-2">
                      <Lightbulb className="h-4 w-4" />
                      Dica
                    </div>
                    {open.dicas.map((d, i) => (
                      <div key={i} className="text-sm text-foreground/85">{d}</div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
