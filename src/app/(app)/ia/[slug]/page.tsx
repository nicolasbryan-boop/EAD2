import { notFound } from "next/navigation";
import { Lock, Bot } from "lucide-react";
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

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{agent.name}</h1>
          <p className="text-sm text-muted">{agent.description}</p>
        </div>
      </div>

      <ChatUI
        agentSlug={slug}
        initialBalance={account?.credits ?? 0}
        conversations={conversations.map((c) => ({ id: c.id, title: c.title }))}
        activeConversationId={conversationId ?? null}
        initialMessages={messages.map((m) => ({
          role: m.role,
          content: m.content,
        }))}
      />
    </div>
  );
}
