"use client";

import { useEffect, useRef } from "react";

/**
 * Fundo animado da tela de login: partículas azuis/ciano em canvas leve.
 * - Movimento CONTÍNUO e lento (velocidade real ~0.12–0.30 px/frame).
 * - Conexões sutis recalculadas a cada frame (só desktop).
 * - Mouse: afasta de leve as partículas próximas + glow radial que segue o
 *   cursor com suavização (lerp).
 * - Respeita prefers-reduced-motion (quadro estático).
 * - Mobile: menos partículas, sem linhas/glow.
 * - pointer-events: none → nunca atrapalha cliques no card de login.
 */
export function LoginBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const LINK_DIST = 130; // distância máx. p/ desenhar linha
    const MOUSE_RADIUS = 160; // raio de interação do cursor

    let w = 0;
    let h = 0;
    let raf = 0;
    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number };
    let particles: P[] = [];

    // Alvo do mouse + posição suavizada do glow.
    const mouse = { x: -9999, y: -9999, active: false };
    let glowX = -9999;
    let glowY = -9999;

    function resize() {
      w = canvas!.clientWidth;
      h = canvas!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      const count = isMobile ? 28 : Math.min(80, Math.floor((w * h) / 18000));
      particles = Array.from({ length: count }, () => {
        // Velocidade VISÍVEL mas lenta: 0.12–0.30 px/frame em direção aleatória.
        const speed = 0.12 + Math.random() * 0.18;
        const ang = Math.random() * Math.PI * 2;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          r: Math.random() * 1.6 + 0.7,
          a: Math.random() * 0.5 + 0.25,
        };
      });
    }

    function frame() {
      ctx!.clearRect(0, 0, w, h);

      // Glow do cursor segue com suavização (lerp).
      if (!isMobile && glowRef.current) {
        if (mouse.active) {
          glowX += (mouse.x - glowX) * 0.12;
          glowY += (mouse.y - glowY) * 0.12;
          glowRef.current.style.transform = `translate(${glowX - 250}px, ${
            glowY - 250
          }px)`;
        }
      }

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        // Reentra suavemente pelo lado oposto.
        if (p.x < -10) p.x = w + 10;
        else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        else if (p.y > h + 10) p.y = -10;

        // Afastamento suave do cursor.
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_RADIUS * MOUSE_RADIUS) {
            const d = Math.sqrt(d2) || 1;
            const f = ((MOUSE_RADIUS - d) / MOUSE_RADIUS) * 0.8;
            p.x += (dx / d) * f;
            p.y += (dy / d) * f;
          }
        }

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(56, 189, 248, ${p.a})`;
        ctx!.fill();
      }

      // Conexões (apenas desktop), recalculadas a cada frame.
      if (!isMobile) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i];
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < LINK_DIST * LINK_DIST) {
              const d = Math.sqrt(d2);
              let alpha = (1 - d / LINK_DIST) * 0.16;
              // Linhas perto do cursor brilham mais.
              if (mouse.active) {
                const mdx = (a.x + b.x) / 2 - mouse.x;
                const mdy = (a.y + b.y) / 2 - mouse.y;
                if (mdx * mdx + mdy * mdy < MOUSE_RADIUS * MOUSE_RADIUS) {
                  alpha = Math.min(0.4, alpha * 2.4);
                }
              }
              ctx!.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
              ctx!.lineWidth = 0.6;
              ctx!.beginPath();
              ctx!.moveTo(a.x, a.y);
              ctx!.lineTo(b.x, b.y);
              ctx!.stroke();
            }
          }
        }
      }

      raf = requestAnimationFrame(frame);
    }

    function drawStatic() {
      ctx!.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(56, 189, 248, ${p.a})`;
        ctx!.fill();
      }
    }

    resize();
    init();
    if (reduced) {
      drawStatic(); // acessibilidade: sem animação
    } else {
      frame();
    }

    function onMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!mouse.active) {
        // primeira leitura: posiciona o glow sem "voar" da origem
        glowX = e.clientX;
        glowY = e.clientY;
      }
      mouse.active = true;
      if (glowRef.current && !isMobile) glowRef.current.style.opacity = "1";
    }
    function onLeave() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
      if (glowRef.current) glowRef.current.style.opacity = "0";
    }
    function onResize() {
      resize();
      init();
    }

    if (!reduced) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseout", onLeave);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Camada 1 — degradê escuro premium */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_70%_-10%,rgba(56,189,248,0.10),transparent_60%),radial-gradient(900px_600px_at_-10%_30%,rgba(124,92,255,0.10),transparent_55%)]" />
      {/* Camada 2 — partículas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* Camada 3 — glow radial que segue o mouse (suavizado) */}
      <div
        ref={glowRef}
        className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full opacity-0 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.14), transparent 60%)",
          willChange: "transform",
        }}
      />
    </div>
  );
}
