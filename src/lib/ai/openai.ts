import OpenAI from "openai";

const SYSTEM_PROMPT = `Você é a IA 1 da Trilogia do Sucesso, uma assistente que ajuda
o aluno a aplicar o conteúdo do curso. Responda em português do Brasil, de forma
prática, objetiva e motivadora. Quando fizer sentido, sugira próximos passos.`;

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

const MODEL = "gpt-4o-mini";

/**
 * Envia o histórico (+ opcionalmente uma imagem e/ou conteúdo de arquivo) para
 * a OpenAI e retorna o texto da resposta. Roda SOMENTE no servidor.
 */
export async function runChat(opts: {
  history: ChatTurn[];
  imageDataUrl?: string | null;
  fileText?: string | null;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY ausente.");

  const client = new OpenAI({ apiKey });

  // Mensagens anteriores (texto puro).
  const prior = opts.history.slice(0, -1).map((t) => ({
    role: t.role,
    content: t.content,
  }));

  // Última mensagem do usuário: pode conter imagem e/ou texto de arquivo.
  const last = opts.history[opts.history.length - 1];
  const userParts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

  let text = last?.content ?? "";
  if (opts.fileText) {
    text += `\n\n[Conteúdo do arquivo enviado pelo aluno]\n${opts.fileText.slice(
      0,
      8000
    )}`;
  }
  userParts.push({ type: "text", text: text || "(sem texto)" });

  if (opts.imageDataUrl) {
    userParts.push({
      type: "image_url",
      image_url: { url: opts.imageDataUrl },
    });
  }

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...(prior as OpenAI.Chat.Completions.ChatCompletionMessageParam[]),
      { role: "user", content: userParts },
    ],
    max_tokens: 800,
    temperature: 0.7,
  });

  return (
    completion.choices[0]?.message?.content?.trim() ||
    "Desculpe, não consegui gerar uma resposta agora. Tente novamente."
  );
}
