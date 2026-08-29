import { createOpenAI } from "@ai-sdk/openai";
import { getServerSession } from "next-auth";
import {
  TypeValidationError,
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
  validateUIMessages,
} from "ai";

import { authOptions } from "@/lib/auth";

type ChatRequestBody = {
  id?: string;
  chatId?: string;
  messages?: UIMessage[];
};

const openaiCompatibleProvider = createOpenAI({
  baseURL:
    process.env.AI_BASE_URL ??
    process.env.OLLAMA_BASE_URL ??
    "http://127.0.0.1:11434/v1",
  apiKey:
    process.env.AI_API_KEY ??
    process.env.OLLAMA_API_KEY ??
    "ollama",
});

const modelId = process.env.AI_MODEL ?? process.env.OLLAMA_MODEL ?? "gemma4:31b-cloud";

function toTextOnlyModelInput(messages: UIMessage[]): UIMessage[] {
  return messages
    .map((message) => {
      const text = message.parts
        .flatMap((part) => (part.type === "text" ? [part.text] : []))
        .join("\n")
        .trim();

      if (!text) {
        return null;
      }

      return {
        ...message,
        parts: [
          {
            type: "text",
            text,
          },
        ],
      } as UIMessage;
    })
    .filter((message): message is UIMessage => message !== null);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as ChatRequestBody;
  const id = body.id ?? body.chatId;

  if (!id) {
    return Response.json({ error: "Missing chat id" }, { status: 400 });
  }

  const messages = body.messages;

  if (!messages || messages.length === 0) {
    return Response.json({ error: "Missing chat message" }, { status: 400 });
  }

  let validatedMessages: UIMessage[];

  try {
    validatedMessages = await validateUIMessages({ messages });
  } catch (error) {
    if (error instanceof TypeValidationError) {
      validatedMessages = messages;
    } else {
      throw error;
    }
  }

  const modelInputMessages = toTextOnlyModelInput(validatedMessages);

  if (modelInputMessages.length === 0) {
    return Response.json(
      { error: "No text content available for model input" },
      { status: 400 },
    );
  }

  const result = streamText({
    model: openaiCompatibleProvider(modelId),
    messages: await convertToModelMessages(modelInputMessages),
  });

  result.consumeStream();

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: validatedMessages,
      generateMessageId: createIdGenerator({
        prefix: "msg",
        size: 16,
      }),
    }),
  });
}
