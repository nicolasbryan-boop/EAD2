import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runChat, type ChatTurn } from "@/lib/ai/openai";
import { AI_CREDIT_COST } from "@/lib/constants";

export const runtime = "nodejs";

/**
 * Endpoint do chat da IA 1.
 * Fluxo seguro:
 *  1. valida sessão e se o agente está ativo
 *  2. calcula custo (texto < imagem < arquivo) e DEBITA de forma atômica
 *  3. chama a OpenAI; em caso de erro, REEMBOLSA os créditos
 *  4. persiste as mensagens e recalcula conquistas
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const {
    conversationId,
    agentSlug = "ia-1",
    message = "",
    imageDataUrl = null,
    fileText = null,
  } = body as {
    conversationId?: string;
    agentSlug?: string;
    message?: string;
    imageDataUrl?: string | null;
    fileText?: string | null;
  };

  const hasImage = !!imageDataUrl;
  const hasFile = !!fileText;

  if (!message.trim() && !hasImage && !hasFile) {
    return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
  }

  // 1. Agente precisa estar ativo (IA 1). IA 2/3 são bloqueadas.
  const { data: agent } = await supabase
    .from("ai_agents")
    .select("slug, is_active")
    .eq("slug", agentSlug)
    .maybeSingle();
  if (!agent?.is_active) {
    return NextResponse.json(
      { error: "Esse agente não está disponível." },
      { status: 403 }
    );
  }

  // 2. Custo: arquivo > imagem > texto.
  const cost = hasFile
    ? AI_CREDIT_COST.file
    : hasImage
    ? AI_CREDIT_COST.image
    : AI_CREDIT_COST.text;

  const { data: debited } = await supabase.rpc("spend_credits", {
    p_amount: cost,
    p_reason: `ia:${agentSlug}`,
  });

  if (!debited) {
    return NextResponse.json(
      { error: "Créditos insuficientes.", needCredits: true },
      { status: 402 }
    );
  }

  // 3. Garante a conversa.
  let convId = conversationId;
  if (!convId) {
    const title = message.trim().slice(0, 40) || "Nova conversa";
    const { data: conv, error } = await supabase
      .from("ai_conversations")
      .insert({ user_id: user.id, agent_slug: agentSlug, title })
      .select("id")
      .single();
    if (error || !conv) {
      await supabase.rpc("refund_credits", { p_amount: cost, p_reason: "erro-conversa" });
      return NextResponse.json({ error: "Falha ao criar conversa." }, { status: 500 });
    }
    convId = conv.id;
  }

  // 4. Salva a mensagem do usuário.
  await supabase.from("ai_messages").insert({
    conversation_id: convId,
    role: "user",
    content: message,
    has_image: hasImage,
    has_file: hasFile,
    credits_cost: cost,
  });

  // 5. Monta o histórico (últimas 20 mensagens) e chama a OpenAI.
  const { data: msgs } = await supabase
    .from("ai_messages")
    .select("role, content")
    .eq("conversation_id", convId)
    .order("created_at", { ascending: true })
    .limit(20);

  const history = (msgs ?? []) as ChatTurn[];

  let reply: string;
  try {
    reply = await runChat({ history, imageDataUrl, fileText });
  } catch (e) {
    // OpenAI falhou → devolve os créditos.
    await supabase.rpc("refund_credits", { p_amount: cost, p_reason: "erro-openai" });
    console.error("Erro OpenAI:", e);
    return NextResponse.json(
      { error: "A IA está indisponível no momento. Seus créditos foram devolvidos." },
      { status: 502 }
    );
  }

  // 6. Salva a resposta + atualiza a conversa.
  await supabase.from("ai_messages").insert({
    conversation_id: convId,
    role: "assistant",
    content: reply,
  });
  await supabase
    .from("ai_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", convId);

  // 7. Conquistas de IA (mente-estratégica, explorador-inteligente).
  await supabase.rpc("recompute_achievements");

  // Saldo atualizado para a UI.
  const { data: credits } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    conversationId: convId,
    reply,
    balance: credits?.balance ?? 0,
    cost,
  });
}
