import { CheckoutResult } from "@/components/checkout/checkout-result";

export const metadata = { title: "Pagamento não concluído — Trilogia do Sucesso" };

export default function Page() {
  return <CheckoutResult status="falha" />;
}
