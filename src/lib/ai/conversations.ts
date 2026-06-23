import { createClient } from "@/lib/supabase/server";

export type ConversationSummary = {
  id: string;
  title: string;
  updated_at: string;
};

export type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  has_image: boolean;
  has_file: boolean;
};

/** Lista as conversas do aluno para um agente. */
export async function listConversations(
  agentSlug: string
): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_conversations")
    .select("id, title, updated_at")
    .eq("agent_slug", agentSlug)
    .order("updated_at", { ascending: false });
  return (data ?? []) as ConversationSummary[];
}

/** Carrega as mensagens de uma conversa (RLS garante que é do aluno). */
export async function getConversationMessages(
  conversationId: string
): Promise<StoredMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_messages")
    .select("id, role, content, has_image, has_file")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return (data ?? []) as StoredMessage[];
}
