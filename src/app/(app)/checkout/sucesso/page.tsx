import { CheckoutResult } from "@/components/checkout/checkout-result";

export const metadata = { title: "Pagamento aprovado — Trilogia do Sucesso" };

export default function Page() {
  return <CheckoutResult status="sucesso" />;
}
