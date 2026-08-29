"use client";

import { type UIMessage } from "ai";
import Dexie, { type Table } from "dexie";

type ChatRecord = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  lastMessagePreview: string;
};

type ConversationRecord = {
  id?: number;
  chatId: string;
  messageId: string;
  role: UIMessage["role"];
  createdAt: number;
  text: string;
  message: UIMessage;
};

class ChatClientDatabase extends Dexie {
  chats!: Table<ChatRecord, string>;
  conversations!: Table<ConversationRecord, number>;

  constructor() {
    super("chaenix-chat-db");

    this.version(1).stores({
      chats: "id, updatedAt, createdAt",
      conversations: "++id, chatId, messageId, createdAt, [chatId+createdAt]",
    });
  }
}

declare global {
  var __chaenixChatDb: ChatClientDatabase | undefined;
}

function getDb() {
  globalThis.__chaenixChatDb ??= new ChatClientDatabase();
  return globalThis.__chaenixChatDb;
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .trim();
}

function getChatTitle(messages: UIMessage[]): string {
  const firstUserMessage = messages.find((message) => message.role === "user");
  const text = firstUserMessage ? getMessageText(firstUserMessage) : "";

  if (!text) {
    return "Untitled Chat";
  }

  return text.slice(0, 72);
}

export async function loadLocalChatSnapshot(chatId: string): Promise<UIMessage[]> {
  const db = getDb();
  const rows = await db.conversations
    .where("chatId")
    .equals(chatId)
    .sortBy("createdAt");

  return rows.map((row) => row.message);
}

export async function saveLocalChatSnapshot({
  chatId,
  messages,
}: {
  chatId: string;
  messages: UIMessage[];
}): Promise<void> {
  const db = getDb();
  const now = Date.now();
  const firstSavedAt = now - messages.length;
  const records: ConversationRecord[] = messages.map((message, index) => ({
    chatId,
    messageId: message.id,
    role: message.role,
    createdAt: firstSavedAt + index,
    text: getMessageText(message),
    message,
  }));

  const lastMessagePreview = records.at(-1)?.text ?? "";

  await db.transaction("rw", db.chats, db.conversations, async () => {
    await db.conversations.where("chatId").equals(chatId).delete();

    if (records.length > 0) {
      await db.conversations.bulkAdd(records);
    }

    const previous = await db.chats.get(chatId);

    await db.chats.put({
      id: chatId,
      title: getChatTitle(messages),
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
      messageCount: messages.length,
      lastMessagePreview,
    });
  });
}

export async function listLocalChats(): Promise<ChatRecord[]> {
  const db = getDb();
  return db.chats.orderBy("updatedAt").reverse().toArray();
}
