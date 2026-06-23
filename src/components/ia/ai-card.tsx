"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import type { AiAgent } from "@/lib/constants";
import { Robot } from "@/components/ia/robot";
import { cn } from "@/lib/utils";

const LOCKED_MESSAGE =
  "Essa IA ainda está em breve. Continue evoluindo na Trilogia do Sucesso para desbloquear novas inteligências.";

/** Configuração visual por agente (robô, cor de energia, glow). */
function styleFor(slug: string, active: boolean) {
  if (active)
    return {
      variant: 1 as const,
      accent: "#34d399", // verde
      glow: "rgba(52,211,153,0.30)",
      ring: "group-hover:ring-[#34d399]/50",
      badge: "bg-[#34d399]/15 text-[#34d399]",
    };
  if (slug === "ia-2")
    return {
      variant: 2 as const,
      accent: "#f87171", // vermelho
      glow: "rgba(248,113,113,0.28)",
      ring: "group-hover:ring-[#f87171]/50",
      badge: "bg-[#f87171]/15 text-[#f87171]",
    };
  return {
    variant: 3 as const,
    accent: "#a855f7", // roxo/vermelho
    glow: "rgba(168,85,247,0.30)",
    ring: "group-hover:ring-[#a855f7]/50",
    badge: "bg-[#a855f7]/15 text-[#a855f7]",
  };
}

export function AiCard({ agent }: { agent: AiAgent }) {
  const active = agent.active;
  const s = styleFor(agent.slug, active);
  const [toast, setToast] = useState(false);

  function showLocked() {
    setToast(true);
    setTimeout(() => setToast(false), 3500);
  }

  return (
    <>
      <div
        className={cn(
          "group relative flex overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2 p-4 transition-all duration-300",
          "ring-1 ring-transparent hover:-translate-y-1",
          s.ring
        )}
        style={{ minHeight: 180 }}
      >
        {/* glow de energia (aparece no hover do desktop) */}
        <div
          className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(120px 120px at 25% 50%, ${s.glow}, transparent 70%)`,
          }}
        />

        {/* lado esquerdo: robô grande */}
        <div className="relative flex w-2/5 items-center justify-center">
          <Robot
            variant={s.variant}
            accent={s.accent}
            className="h-36 w-full max-w-[120px]"
          />
        </div>

        {/* lado direito: conteúdo */}
        <div className="relative flex w-3/5 flex-col pl-3">
          <div className="flex items-center justify-between">
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", s.badge)}>
              {active ? "Liberada" : "Em breve"}
            </span>
            {!active && <Lock className="h-4 w-4 text-muted" />}
          </div>

          <h3 className="mt-2 text-lg font-semibold">{agent.name}</h3>
          <p className="mt-1 line-clamp-3 text-xs text-muted">
            {agent.description}
          </p>

          <div className="mt-auto pt-3">
            {active ? (
              <Link
                href={`/ia/${agent.slug}`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#34d399] px-3.5 py-2 text-sm font-medium text-black transition-transform group-hover:scale-[1.03]"
              >
                Acessar IA 1 <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                onClick={showLocked}
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-sm font-medium text-muted"
              >
                <Lock className="h-4 w-4" /> Bloqueada
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast ao tentar abrir IA bloqueada */}
      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="flex items-start gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm shadow-2xl">
            <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
            <span className="max-w-xs">{LOCKED_MESSAGE}</span>
          </div>
        </div>
      )}
    </>
  );
}
