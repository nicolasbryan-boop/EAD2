import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { ChatUI } from "@/components/ia/chat-ui";
import { AI_AGENTS } from "@/lib/constants";
import { getAccountData } from "@/lib/account";
import {
  listConversations,
  getConversationMessages,
} from "@/lib/ai/conversations";

export default async function IaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { slug } = await params;
  const { c: conversationId } = await searchParams;

  const agent = AI_AGENTS.find((a) => a.slug === slug);
  if (!agent) notFound();

  // IA 2 e IA 3: tela bloqueada / em breve.
  if (!agent.active) {
    return (
      <div>
        <PageHeader title={agent.name} />
        <Card className="flex flex-col items-center text-center py-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-muted">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="mt-4">Em breve</CardTitle>
          <CardDescription className="mt-2 max-w-md">
            Essa IA ainda não está disponível no seu plano. Em breve você poderá
            desbloquear novos agentes inteligentes.
          </CardDescription>
        </Card>
      </div>
    );
  }

  // IA 1: liberada → chat completo.
  const [account, conversations, messages] = await Promise.all([
    getAccountData(),
    listConversations(slug),
    conversationId
      ? getConversationMessages(conversationId)
      : Promise.resolve([]),
  ]);

  // O robô inteiro + título + descrição + créditos ficam no hero do ChatUI.
  return (
    <ChatUI
      agentSlug={slug}
      agentName={agent.name}
      agentDescription={agent.description}
      initialBalance={account?.credits ?? 0}
      conversations={conversations.map((c) => ({ id: c.id, title: c.title }))}
      activeConversationId={conversationId ?? null}
      initialMessages={messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))}
    />
  );
}
