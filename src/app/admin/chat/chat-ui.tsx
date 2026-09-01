"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { marked } from "marked";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Virtuoso, type Components, type VirtuosoHandle } from "react-virtuoso";

import {
  getLocalChat,
  loadLocalChatSnapshot,
  renameLocalChat,
  saveLocalChatSnapshot,
} from "@/lib/chat-client-store";

type ChatUiProps = {
  id: string;
  initialMessages: UIMessage[];
};

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-chat-ui",
  weight: ["400", "500", "700"],
});

marked.setOptions({
  gfm: true,
  breaks: true,
  async: false,
});

function parseMarkdown(text: string): string {
  const escapedText = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  return marked.parse(escapedText, { async: false }) as string;
}

const assistantMarkdownClasses =
  "space-y-2 break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 " +
  "[&_a]:text-[var(--brand-strong)] [&_a]:underline [&_a]:underline-offset-2 " +
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--border)] [&_blockquote]:pl-3 [&_blockquote]:text-[var(--text-secondary)] " +
  "[&_code]:rounded [&_code]:bg-[var(--surface-muted)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] " +
  "[&_h1]:my-2 [&_h1]:text-base [&_h1]:font-bold [&_h2]:my-2 [&_h2]:text-sm [&_h2]:font-bold [&_h3]:my-2 [&_h3]:text-sm [&_h3]:font-semibold " +
  "[&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 " +
  "[&_p]:my-2 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-[var(--border)] [&_pre]:bg-[var(--surface-soft)] [&_pre]:p-2 " +
  "[&_strong]:font-semibold";

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2c.7 4.9 3.4 7.6 8.3 8.3-4.9.7-7.6 3.4-8.3 8.3-.7-4.9-3.4-7.6-8.3-8.3 4.9-.7 7.6-3.4 8.3-8.3z" />
    </svg>
  );
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function AssistantAvatar({ active = false }: { active?: boolean }) {
  return (
    <div
      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-strong)] text-white shadow-sm ${
        active ? "chat-avatar-active" : ""
      }`}
    >
      <SparkleIcon className="h-4 w-4" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-secondary)] shadow-sm">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="chat-message-enter flex items-start gap-2.5">
      <AssistantAvatar active />
      <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-md border border-[var(--border)] bg-white px-4 py-3 shadow-[0_12px_28px_-22px_rgba(39,77,136,0.5)]">
        <span className="chat-thinking-text text-sm font-medium">Thinking</span>
        <span className="flex items-center gap-1">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="chat-thinking-dot h-1.5 w-1.5 rounded-full bg-[var(--brand)]"
              style={{ animationDelay: `${dot * 0.15}s` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-strong)] text-white shadow-md">
        <SparkleIcon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          How can I help you today?
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Start the conversation with your first prompt.
        </p>
      </div>
    </div>
  );
}

type MessageAttachment = { id: string; name: string; content: string };

type MessageRowProps = {
  message: UIMessage;
  animate: boolean;
  isStreaming: boolean;
};

function MessageRow({ message, animate, isStreaming }: MessageRowProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const attachments = useMemo<MessageAttachment[]>(() => {
    const metadata = message.metadata as
      | { attachments?: MessageAttachment[] }
      | undefined;
    return metadata?.attachments ?? [];
  }, [message.metadata]);

  const messageText = useMemo(() => {
    return message.parts
      .map((part) => {
        if (part.type === "text") {
          return (part as { text: string }).text;
        }
        return "";
      })
      .join("");
  }, [message.parts]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("[ChatUi] Failed to copy message:", error);
    }
  }, [messageText]);

  return (
    <div
      className={`px-3 pb-3 sm:px-4 ${animate ? "chat-message-enter" : ""}`}
    >
      <div
        className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
      >
        {isUser ? <UserAvatar /> : <AssistantAvatar active={isStreaming} />}

        <div
          className={`flex max-w-[80%] flex-col gap-2 ${
            isUser ? "items-end" : "items-start"
          }`}
        >
          <div
            className={
              isUser
                ? "flex min-h-[56px] w-full flex-col gap-2 items-end rounded-2xl rounded-tr-md bg-gradient-to-br from-[var(--brand)] to-[var(--brand-strong)] px-4 py-2.5 text-sm leading-relaxed text-white shadow-[0_10px_24px_-16px_rgba(39,77,136,0.8)]"
                : "flex min-h-[64px] w-full items-start rounded-2xl rounded-tl-md border border-[var(--border)] bg-white px-4 py-3 text-sm leading-relaxed text-[var(--text-primary)] shadow-[0_12px_28px_-22px_rgba(39,77,136,0.5)]"
            }
          >
            {isUser && attachments.length > 0 ? (
              <div className="flex w-full flex-wrap justify-end gap-1.5">
                {attachments.map((attachment) => (
                  <span
                    key={attachment.id}
                    className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-1 text-[11px] font-medium text-white"
                  >
                    <PaperclipIcon className="h-3 w-3" />
                    <span className="max-w-[180px] truncate">
                      {attachment.name}
                    </span>
                  </span>
                ))}
              </div>
            ) : null}

            {message.parts.map((part, index) => {
              if (part.type !== "text") {
                return null;
              }

              const partText = (part as { text: string }).text;

              if (isUser) {
                if (!partText.trim()) {
                  return null;
                }
                return (
                  <p
                    key={`${message.id}-${index}`}
                    className="whitespace-pre-wrap break-words"
                  >
                    {partText}
                  </p>
                );
              }

              return (
                <div
                  key={`${message.id}-${index}`}
                  className={assistantMarkdownClasses}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(partText) }}
                />
              );
            })}

            {isStreaming ? (
              <span className="chat-stream-cursor mt-1 inline-block h-3.5 w-2 rounded-[2px] bg-[var(--brand)]" />
            ) : null}
          </div>

          {!isUser && !isStreaming ? (
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? "Copied to clipboard" : "Copy message"}
              className="inline-flex items-center gap-1 self-end rounded-md px-2 py-1 text-[11px] font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)]"
            >
              {copied ? (
                <CheckIcon className="h-3 w-3" />
              ) : (
                <CopyIcon className="h-3 w-3" />
              )}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ChatUi({ id, initialMessages }: ChatUiProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [localCacheReadyId, setLocalCacheReadyId] = useState<string | null>(
    null,
  );
  const [chatTitle, setChatTitle] = useState("Untitled Chat");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const hasLoadedLocalCache = useRef(false);
  const skipEntryAnimationIds = useRef(
    new Set(initialMessages.map((message) => message.id)),
  );
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const didScrollOnFirstMessagesRef = useRef(false);
  const lastSeenStreamingMessageIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, setMessages, status, stop } = useChat({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages: pendingMessages, id: chatId }) {
        const hasConversationTurn = pendingMessages.some(
          (message) => message.role === "user" || message.role === "assistant",
        );

        const transformedMessages = pendingMessages.map((message) => {
          if (message.role !== "user") {
            return { ...message, metadata: undefined };
          }

          const metadata = message.metadata as
            | { attachments?: MessageAttachment[] }
            | undefined;
          const userAttachments = metadata?.attachments;

          if (!userAttachments || userAttachments.length === 0) {
            return { ...message, metadata: undefined };
          }

          const fileContentText = userAttachments
            .map(
              (attachment) =>
                `[Attached file: ${attachment.name}]\n${attachment.content}`,
            )
            .join("\n\n");

          const existingText = message.parts
            .map((part) =>
              part.type === "text" ? (part as { text: string }).text : "",
            )
            .join("");

          const combinedText = existingText
            ? `${fileContentText}\n\n${existingText}`
            : fileContentText;

          return {
            ...message,
            parts: [{ type: "text", text: combinedText }],
            metadata: undefined,
          };
        });

        const messagesToSend = hasConversationTurn
          ? transformedMessages
          : [
              {
                id: "system-prompt",
                role: "system" as const,
                parts: [
                  { type: "text" as const, text: "You are helpful assistant" },
                ],
              },
              ...transformedMessages,
            ];

        return {
          body: {
            id: chatId,
            messages: messagesToSend,
          },
        };
      },
    }),
  });

  useEffect(() => {
    let isActive = true;

    hasLoadedLocalCache.current = false;

    void (async () => {
      try {
        const localMessages = await loadLocalChatSnapshot(id);

        if (!isActive) {
          return;
        }

        if (localMessages.length === 0) {
          return;
        }

        for (const message of localMessages) {
          if (message && message.id) {
            skipEntryAnimationIds.current.add(message.id);
          }
        }

        setMessages(localMessages);
      } catch (error) {
        console.error("[ChatUi] Failed to load local chat snapshot:", error);
      } finally {
        if (isActive) {
          hasLoadedLocalCache.current = true;
          setLocalCacheReadyId(id);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [id, setMessages]);

  useEffect(() => {
    if (!hasLoadedLocalCache.current) {
      return;
    }

    void (async () => {
      await saveLocalChatSnapshot({
        chatId: id,
        messages,
      });

      const record = await getLocalChat(id);

      if (record) {
        setChatTitle(record.title);
      }
    })();
  }, [id, messages]);

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const record = await getLocalChat(id);

      if (!isActive) {
        return;
      }

      setIsEditingTitle(false);
      setTitleDraft("");
      setChatTitle(record?.title ?? "Untitled Chat");
    })();

    return () => {
      isActive = false;
    };
  }, [id]);

  const isSending = status === "submitted" || status === "streaming";
  const isThinking = status === "submitted";
  const isLocalCacheReady = localCacheReadyId === id;

  // Track the id of the message currently being streamed so MessageRow can
  // read it without re-rendering `itemContent` on every status update.
  useEffect(() => {
    if (status === "streaming" && messages.length > 0) {
      const last = messages[messages.length - 1];
      lastSeenStreamingMessageIdRef.current =
        last.role === "assistant" ? last.id : null;
    } else {
      lastSeenStreamingMessageIdRef.current = null;
    }
  }, [status, messages]);

  // Scroll to bottom once when messages first become available (after cache
  // hydration). `followOutput` handles subsequent appends; this only seeds the
  // initial position.
  useEffect(() => {
    if (didScrollOnFirstMessagesRef.current || messages.length === 0) {
      return;
    }

    const handle = virtuosoRef.current;

    if (!handle) {
      return;
    }

    const id = requestAnimationFrame(() => {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        align: "end",
        behavior: "auto",
      });
      didScrollOnFirstMessagesRef.current = true;
    });

    return () => cancelAnimationFrame(id);
  }, [messages.length]);

  const placeholder = useMemo(() => {
    if (isSending) {
      return "Generating response...";
    }

    return "Ask something about your project...";
  }, [isSending]);

  const handleFileSelect = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);

      if (files.length === 0) {
        return;
      }

      const nextAttachments: MessageAttachment[] = [];

      for (const file of files) {
        try {
          const content = await file.text();
          nextAttachments.push({
            id:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: file.name,
            content,
          });
        } catch (error) {
          console.error(
            "[ChatUi] Failed to read attached file:",
            file.name,
            error,
          );
        }
      }

      if (nextAttachments.length > 0) {
        setAttachments((prev) => [...prev, ...nextAttachments]);
      }

      event.target.value = "";
    },
    [],
  );

  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments((prev) =>
      prev.filter((attachment) => attachment.id !== attachmentId),
    );
  }, []);

  const startEditTitle = useCallback(() => {
    setTitleDraft(chatTitle);
    setIsEditingTitle(true);
  }, [chatTitle]);

  const handleSaveTitle = useCallback(async () => {
    const trimmedTitle = titleDraft.trim();

    if (!trimmedTitle) {
      return;
    }

    await renameLocalChat(id, trimmedTitle);
    setChatTitle(trimmedTitle);
    setIsEditingTitle(false);
  }, [id, titleDraft]);

  const handleSend = useCallback(() => {
    const value = input.trim();
    const hasAttachments = attachments.length > 0;

    if (!value && !hasAttachments) {
      return;
    }

    if (isSending) {
      return;
    }

    const payload = value.length > 0 ? value : " ";
    const attachmentPayload: MessageAttachment[] = attachments.map(
      ({ id, name, content }) => ({ id, name, content }),
    );

    sendMessage({
      text: payload,
      metadata: {
        attachments: attachmentPayload,
      },
    } as Parameters<typeof sendMessage>[0]);

    setInput("");
    setAttachments([]);

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
    }
  }, [input, attachments, isSending, sendMessage]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  }, [input]);

  const virtuosoComponents = useMemo<Components<UIMessage>>(
    () => ({
      Header: () => <div className="h-3 sm:h-4" />,
      EmptyPlaceholder: () => <EmptyState />,
      Footer: () => (
        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
          {isThinking ? <ThinkingBubble /> : null}
        </div>
      ),
    }),
    [isThinking],
  );

  const renderItemContent = useCallback(
    (index: number, message: UIMessage) => (
      <MessageRow
        message={message}
        animate={!skipEntryAnimationIds.current.has(message.id)}
        isStreaming={
          message.role === "assistant" &&
          lastSeenStreamingMessageIdRef.current === message.id
        }
      />
    ),
    [],
  );

  const computeItemKey = useCallback(
    (_: number, message: UIMessage) => message.id,
    [],
  );

  return (
    <main className={`${uiFont.variable} flex h-full min-h-0 flex-col [font-family:var(--font-chat-ui)]`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-white/70 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="min-w-0">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSaveTitle();
                  }
                  if (event.key === "Escape") {
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                aria-label="Chat name"
                className="w-full max-w-xs rounded-md border border-[var(--border)] bg-white px-2 py-1 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
              />
              <button
                type="button"
                onClick={() => void handleSaveTitle()}
                disabled={!titleDraft.trim()}
                className="shrink-0 rounded-md bg-[var(--brand)] px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-sm font-semibold tracking-wide text-[var(--text-primary)]">
                {chatTitle || "Untitled Chat"}
              </p>
              <button
                type="button"
                onClick={startEditTitle}
                aria-label="Rename chat"
                className="shrink-0 rounded-md p-1 text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)]"
              >
                <EditIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <p className="mt-1 break-all text-xs text-[var(--text-muted)]">
            ID: {id}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <p className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
            Cache: {isLocalCacheReady ? "ready" : "syncing"}
          </p>

          <Link
            href="/admin/history"
            className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-soft)]"
          >
            History
          </Link>

          <Link
            href="/admin/chat"
            className="rounded-xl bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[var(--brand-strong)]"
          >
            New Chat
          </Link>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        <Virtuoso
          ref={virtuosoRef}
          className="chat-scroll h-full"
          data={messages}
          initialTopMostItemIndex={Math.max(0, messages.length - 1)}
          defaultItemHeight={72}
          increaseViewportBy={240}
          minOverscanItemCount={6}
          followOutput="smooth"
          computeItemKey={computeItemKey}
          components={virtuosoComponents}
          itemContent={renderItemContent}
        />
      </div>

      <form
        className="border-t border-[var(--border)] bg-white/70 px-4 py-4 backdrop-blur-md sm:px-6"
        onSubmit={(event) => {
          event.preventDefault();
          handleSend();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />

        {attachments.length > 0 ? (
          <div className="mx-auto mb-2 flex w-full max-w-4xl flex-wrap gap-2">
            {attachments.map((attachment) => (
              <span
                key={attachment.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-xs text-[var(--text-secondary)] shadow-sm"
              >
                <PaperclipIcon className="h-3 w-3 text-[var(--text-muted)]" />
                <span className="max-w-[200px] truncate font-medium text-[var(--text-primary)]">
                  {attachment.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  aria-label={`Remove ${attachment.name}`}
                  className="ml-0.5 flex h-4 w-4 items-center justify-center rounded text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="mx-auto flex w-full max-w-4xl items-end gap-2 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-[0_14px_30px_-24px_rgba(39,77,136,0.55)] transition focus-within:border-[var(--focus-ring)] focus-within:shadow-[0_0_0_3px_rgba(126,164,218,0.28)]">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            aria-label="Attach file"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PaperclipIcon className="h-5 w-5" />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder={placeholder}
            rows={1}
            className="chat-textarea max-h-32 min-h-[40px] w-full flex-1 resize-none bg-transparent px-1 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />

          {isSending ? (
            <button
              type="button"
              onClick={() => stop()}
              aria-label="Stop generating"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white transition hover:bg-[var(--brand-strong)]"
            >
              <span className="block h-3.5 w-3.5 rounded-[3px] bg-white" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() && attachments.length === 0}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
              </svg>
            </button>
          )}
        </div>

        <p className="mx-auto mt-2 max-w-4xl text-center text-[11px] text-[var(--text-muted)]">
          <kbd className="rounded border border-[var(--border)] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-secondary)] shadow-sm">
            Shift
          </kbd>
          {" + "}
          <kbd className="rounded border border-[var(--border)] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-secondary)] shadow-sm">
            Enter
          </kbd>
          {" for new line · Enter to send · "}AI can make mistakes. Please verify important information.
        </p>
      </form>
    </main>
  );
}
