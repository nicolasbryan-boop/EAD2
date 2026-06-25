import Image from "next/image";

/** Logo oficial (Stitch) — pirâmide ciano→roxo com núcleo pulsante. */
export function Logo({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo-trilogia.svg"
      alt="Trilogia do Sucesso"
      width={size}
      height={size}
      unoptimized
      priority
      className={className}
    />
  );
}
