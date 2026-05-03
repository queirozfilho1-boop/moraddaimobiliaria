import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Route } from "lucide-react";
import { FLUXOS, COR_BAR, COR_BG, COR_GRAD } from "@/data/moradda-simple";

export function FluxosSection() {
  const [activeId, setActiveId] = useState(FLUXOS[0].id);
  const ativo = FLUXOS.find((f) => f.id === activeId)!;

  return (
    <section id="fluxos" className="bg-secondary/40 border-y border-border">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-c-dourado-text font-semibold">
            <Route className="h-4 w-4" />
            As sequências
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold mt-2">
            Como as coisas acontecem na prática
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            Cada fluxo abaixo conta uma história completa, do começo ao fim. Escolha um e veja
            quem faz o quê em cada etapa.
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          {FLUXOS.map((f) => {
            const active = f.id === activeId;
            return (
              <button
                key={f.id}
                onClick={() => setActiveId(f.id)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  active
                    ? `text-white shadow-md ${COR_BAR[f.cor]}`
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-c-dourado/40"
                }`}
              >
                {f.nome}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={ativo.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            <div className="rounded-2xl bg-card border border-border p-6 sm:p-8">
              <p className="text-foreground/80 text-lg leading-relaxed mb-8">{ativo.resumo}</p>

              {/* Timeline */}
              <ol className="relative">
                {ativo.passos.map((p, i) => {
                  const Icon = p.icone;
                  const isLast = i === ativo.passos.length - 1;
                  return (
                    <li key={i} className="relative pl-16 sm:pl-20 pb-8 last:pb-0">
                      {/* connector line */}
                      {!isLast && (
                        <div className={`absolute left-[22px] sm:left-[26px] top-12 bottom-0 w-0.5 ${COR_BAR[ativo.cor]} opacity-25`} />
                      )}
                      {/* number bubble */}
                      <div className={`absolute left-0 top-0 h-11 w-11 sm:h-13 sm:w-13 rounded-full bg-gradient-to-br ${COR_GRAD[ativo.cor]} text-white inline-flex items-center justify-center shadow-md`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="absolute left-9 sm:left-11 top-0 -translate-y-1 text-[10px] font-bold tracking-widest text-muted-foreground bg-card px-1.5">
                        {String(i + 1).padStart(2, "0")}
                      </div>

                      <div className="rounded-xl bg-secondary/60 border border-border p-4 sm:p-5">
                        <div className="flex items-baseline gap-3 flex-wrap">
                          <h3 className="font-semibold text-lg text-foreground">{p.titulo}</h3>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${COR_BG[ativo.cor]}`}>
                            {p.quem}
                          </span>
                        </div>
                        <p className="mt-2 text-[15px] text-foreground/80 leading-relaxed">{p.acao}</p>
                      </div>

                      {!isLast && (
                        <div className="flex justify-center mt-3">
                          <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
