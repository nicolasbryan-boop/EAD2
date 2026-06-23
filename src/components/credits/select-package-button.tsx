"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/actions/cart";

export function SelectPackageButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await addToCart(slug);
      if (res.ok) router.push("/carrinho");
    });
  }

  return (
    <Button className="mt-4 w-full" onClick={handleClick} disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Selecionar
    </Button>
  );
}
