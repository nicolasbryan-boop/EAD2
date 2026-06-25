"use client";

import {
  SUPPORT_WHATSAPP_NUMBER,
  SUPPORT_WHATSAPP_MESSAGE,
} from "@/lib/constants";

/**
 * Botão flutuante do WhatsApp (canto inferior direito).
 * Abre wa.me em nova aba com a mensagem padrão; se o aluno estiver logado,
 * inclui nome/e-mail. Não atrapalha o formulário de suporte (canto da tela).
 */
export function WhatsAppFab({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  let message = SUPPORT_WHATSAPP_MESSAGE;
  if (name || email) {
    message += ` Meu nome é ${name ?? "—"} e meu e-mail é ${email ?? "—"}.`;
  }
  const href = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com suporte pelo WhatsApp"
      className="group fixed bottom-6 right-6 z-40 flex items-center gap-3"
    >
      {/* Tooltip (aparece no hover, desktop) */}
      <span className="pointer-events-none hidden rounded-xl bg-surface px-3 py-2 text-sm shadow-lg ring-1 ring-border opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:block">
        Falar no WhatsApp
      </span>

      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_-6px_rgba(37,211,102,0.7)] transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
        {/* Pulso suave de destaque */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping [animation-duration:2.5s]" />
        {/* Logo do WhatsApp */}
        <svg
          viewBox="0 0 32 32"
          className="relative h-7 w-7 fill-current"
          aria-hidden
        >
          <path d="M16.001 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.46 1.73 6.4L3.2 28.8l6.57-1.72a12.74 12.74 0 0 0 6.23 1.6h.01c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.8-12.8-12.8Zm0 23.36h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.9 1.02 1.04-3.8-.25-.39a10.56 10.56 0 0 1-1.62-5.64c0-5.86 4.77-10.63 10.64-10.63 2.84 0 5.5 1.11 7.51 3.12a10.55 10.55 0 0 1 3.11 7.52c0 5.86-4.77 10.62-10.63 10.62Zm5.83-7.96c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1 1.25-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.54-.71-.55l-.61-.01c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.63s1.13 3.05 1.29 3.26c.16.21 2.22 3.39 5.38 4.75.75.32 1.34.52 1.8.66.76.24 1.44.21 1.98.13.6-.09 1.89-.77 2.16-1.52.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z" />
        </svg>
      </span>
    </a>
  );
}
