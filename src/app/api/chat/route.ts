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
import { resolveModelSelection } from "@/lib/ai/provider";

type ChatRequestBody = {
  id?: string;
  chatId?: string;
  messages?: UIMessage[];
  model?: string;
};

export const runtime = "nodejs";

const ALLOWED_IMAGE_MEDIA_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

function toModelInput(
  messages: UIMessage[],
  imageSupport: boolean,
): UIMessage[] {
  return messages.flatMap((message) => {
    const text = message.parts
      .flatMap((part) => (part.type === "text" ? [part.text] : []))
      .join("\n")
      .trim();

    const imageParts = imageSupport
      ? message.parts.filter(
          (part) =>
            part.type === "file" && ALLOWED_IMAGE_MEDIA_TYPES.has(part.mediaType),
        )
      : [];

    if (!text && imageParts.length === 0) {
      return [];
    }

    const parts: UIMessage["parts"] = [];

    if (text) {
      parts.push({ type: "text", text });
    }

    parts.push(...imageParts);

    return [{ ...message, parts } as UIMessage];
  });
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

  const resolvedModel = resolveModelSelection(body.model ?? "");

  if (!resolvedModel) {
    return Response.json({ error: "Unknown model" }, { status: 400 });
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

  const modelInputMessages = toModelInput(
    validatedMessages,
    resolvedModel.imageSupport,
  );

  if (modelInputMessages.length === 0) {
    return Response.json(
      { error: "No text content available for model input" },
      { status: 400 },
    );
  }

  const openaiCompatibleProvider = createOpenAI({
    baseURL: resolvedModel.baseURL,
    apiKey: resolvedModel.apiKey,
  });

  const result = streamText({
    model: openaiCompatibleProvider.chat(resolvedModel.providerModel),
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
