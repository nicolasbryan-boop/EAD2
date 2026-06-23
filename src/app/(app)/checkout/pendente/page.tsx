import { CheckoutResult } from "@/components/checkout/checkout-result";

export const metadata = { title: "Pagamento pendente — Trilogia do Sucesso" };

export default function Page() {
  return <CheckoutResult status="pendente" />;
}
