"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, Lock, ArrowRight } from "lucide-react";
import type { AiAgent } from "@/lib/constants";

/**
 * Card de IA com efeito premium/futurista no desktop:
 * - leve movimento (translateY) no hover
 * - glow do robô
 * - botão que aparece no hover
 * No mobile (touch) o `whileHover` simplesmente não dispara — sem animação
 * pesada, respeitando a regra do projeto.
 */
export function AiCard({ agent }: { agent: AiAgent }) {
  const locked = !agent.active;

  return (
    <motion.div
      whileHover={locked ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface/70 p-6"
    >
      {/* glow de fundo (aparece no hover, desktop) */}
      {!locked && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      )}

      <div className="relative flex items-start justify-between">
        <motion.div
          whileHover={locked ? undefined : { rotate: -6, scale: 1.08 }}
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            locked
              ? "bg-surface-2 text-muted"
              : "bg-gradient-to-br from-primary to-accent text-white shadow-[0_0_24px_-4px_var(--primary)]"
          }`}
        >
          <Bot className="h-6 w-6" />
        </motion.div>
        {locked && (
          <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] text-muted">
            <Lock className="h-3 w-3" /> Em breve
          </span>
        )}
      </div>

      <h3 className="mt-4 text-lg font-semibold">{agent.name}</h3>
      <p className="mt-1 text-sm text-muted line-clamp-2">{agent.description}</p>

      {locked ? (
        <div className="mt-5 text-sm text-muted">Bloqueada no seu plano</div>
      ) : (
        <Link
          href={`/ia/${agent.slug}`}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 md:opacity-0 max-md:opacity-100 max-md:translate-y-0"
        >
          Abrir IA <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </motion.div>
  );
}
