"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { marked } from "marked";
import Link from "next/link";
import { Inter } from "next/font/google";
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

const uiFont = Inter({
  subsets: ["latin"],
  variable: "--font-chat-ui",
  weight: ["400", "500", "600", "700"],
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
  "min-w-0 max-w-full space-y-3 break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 " +
  "[&_a]:text-[var(--brand-strong)] [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-[var(--brand)]/40 [&_a]:transition-colors [&_a]:hover:decoration-[var(--brand)] " +
  "[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--brand)]/30 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[var(--text-secondary)] " +
  "[&:not(pre)_&_code]:rounded-md [&:not(pre)_&_code]:bg-[var(--surface-muted)] [&:not(pre)_&_code]:px-1.5 [&:not(pre)_&_code]:py-0.5 [&:not(pre)_&_code]:text-[0.85em] [&:not(pre)_&_code]:font-mono " +
  "[&_h1]:my-3 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:tracking-tight [&_h2]:my-3 [&_h2]:text-base [&_h2]:font-bold [&_h2]:tracking-tight [&_h3]:my-3 [&_h3]:text-sm [&_h3]:font-semibold " +
  "[&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 " +
  "[&_p]:my-2.5 [&_pre]:my-3 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-[var(--border)] [&_pre]:bg-[var(--surface-muted)] [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-[13px] " +
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

function ArrowUpIcon({ className }: { className?: string }) {
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
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <rect width="10" height="10" x="7" y="7" rx="2" />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
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
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function ThinkingBubble() {
  return (
    <div className="chat-message-enter px-4 pb-3 sm:pb-4">
      <div className="flex min-h-[56px] w-full items-start rounded-[28px] rounded-tl-lg border border-gray-100 bg-white px-5 py-3.5 shadow-sm shadow-black/5">
        <span className="flex items-center gap-2">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="chat-thinking-dot h-2 w-2 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-strong)]"
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
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-strong)] text-white shadow-2xl shadow-[var(--brand)]/30">
          <SparkleIcon className="h-7 w-7" />
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-strong)] opacity-20 blur-xl" />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          How can I help you today?
        </p>
        <p className="text-sm text-[var(--text-muted)]">
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
  isThinking: boolean;
};

function MessageRow({ message, animate, isStreaming, isThinking }: MessageRowProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (isUser || !contentRef.current) return;

    const container = contentRef.current;
    const preElements = container.querySelectorAll("pre");

    preElements.forEach((pre) => {
      if (pre.parentElement?.hasAttribute("data-code-wrapper")) return;

      const code = pre.querySelector("code");
      if (!code) return;

      const codeText = code.textContent ?? "";
      const button = document.createElement("button");
      button.setAttribute("data-copy-btn", "true");
      button.setAttribute("type", "button");
      button.setAttribute("aria-label", "Copy code");
      button.className =
        "absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-lg border border-[var(--border)]/60 bg-white/90 px-2 py-1 text-[11px] font-medium text-[var(--text-muted)] shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)] active:scale-95";
      button.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>Copy</span>';

      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(codeText);
          button.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 text-green-500" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg><span>Copied</span>';
          window.setTimeout(() => {
            button.innerHTML =
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>Copy</span>';
          }, 1800);
        } catch (error) {
          console.error("[ChatUi] Failed to copy code:", error);
        }
      });

      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-code-wrapper", "true");
      wrapper.className = "relative max-w-full";
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      wrapper.appendChild(button);
    });
  }, [message.parts, isUser]);

  return (
    <div
      className={`px-4 pb-3 sm:pb-4 ${animate ? "chat-message-enter" : ""}`}
    >
      <div
        className={`flex items-start ${isUser ? "flex-row-reverse" : ""}`}
      >
        <div
          className={`flex min-w-0 flex-col gap-2 ${
            isUser ? "w-full items-end" : "max-w-full flex-1 items-start"
          }`}
        >
          <div
            className={
              isUser
                ? "flex min-h-[48px] w-fit max-w-full flex-col gap-2 items-end rounded-[28px] rounded-tr-lg bg-gradient-to-br from-[var(--brand)] to-[var(--brand-strong)] px-5 py-3.5 text-sm leading-relaxed text-white shadow-md shadow-black/10"
                : "flex min-h-[56px] w-full min-w-0 max-w-full overflow-hidden items-start rounded-[28px] rounded-tl-lg border border-gray-100 bg-white px-5 py-3.5 text-sm leading-relaxed text-[var(--text-primary)] shadow-sm shadow-black/5"
            }
          >
            {isUser && attachments.length > 0 ? (
              <div className="flex w-full flex-wrap justify-end gap-1.5">
                {attachments.map((attachment) => (
                  <span
                    key={attachment.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm"
                  >
                    <PaperclipIcon className="h-3 w-3" />
                    <span className="max-w-[160px] truncate">
                      {attachment.name}
                    </span>
                  </span>
                ))}
              </div>
            ) : null}

            <div ref={contentRef} className="w-full min-w-0 max-w-full">
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

                if (!partText.trim() && (isThinking || isStreaming)) {
                  return (
                    <span key={`${message.id}-${index}`} className="flex items-center gap-2 py-1">
                      {[0, 1, 2].map((dot) => (
                        <span
                          key={dot}
                          className="chat-thinking-dot h-2 w-2 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-strong)]"
                          style={{ animationDelay: `${dot * 0.15}s` }}
                        />
                      ))}
                    </span>
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
            </div>

            {isStreaming && messageText.trim() ? (
              <span className="chat-stream-cursor mt-1 inline-block h-4 w-[3px] rounded-full bg-[var(--brand)]" />
            ) : null}
          </div>

          {isUser || !isStreaming ? (
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? "Copied to clipboard" : "Copy message"}
              className="inline-flex items-center gap-1.5 self-end rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)] active:scale-95"
            >
              {copied ? (
                <CheckIcon className="h-3 w-3 text-green-500" />
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

  useEffect(() => {
    if (status === "streaming" && messages.length > 0) {
      const last = messages[messages.length - 1];
      lastSeenStreamingMessageIdRef.current =
        last.role === "assistant" ? last.id : null;
    } else {
      lastSeenStreamingMessageIdRef.current = null;
    }
  }, [status, messages]);

  useEffect(() => {
    if (didScrollOnFirstMessagesRef.current || messages.length === 0) {
      return;
    }

    const handle = virtuosoRef.current;

    if (!handle) {
      return;
    }

    const animId = requestAnimationFrame(() => {
      virtuosoRef.current?.scrollToIndex({
        index: displayMessages.length - 1,
        align: "end",
        behavior: "auto",
      });
      didScrollOnFirstMessagesRef.current = true;
    });

    return () => cancelAnimationFrame(animId);
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

  const thinkingMessage = useMemo<UIMessage | null>(() => {
    if (!isThinking) return null;
    return {
      id: "__thinking__",
      role: "assistant",
      parts: [],
    };
  }, [isThinking]);

  const displayMessages = useMemo(() => {
    if (thinkingMessage) {
      return [
        ...messages.filter(
          (m) =>
            !(
              m.role === "assistant" &&
              !m.parts.some(
                (p) => p.type === "text" && (p as { text: string }).text.trim(),
              )
            ),
        ),
        thinkingMessage,
      ];
    }
    return messages;
  }, [messages, thinkingMessage]);

  const virtuosoComponents = useMemo<Components<UIMessage>>(
    () => ({
      Header: () => <div className="h-4 sm:h-6" />,
      EmptyPlaceholder: () => <EmptyState />,
      Footer: () => <div className="pb-4 sm:pb-6" />,
    }),
    [],
  );

  const renderItemContent = useCallback(
    (index: number, message: UIMessage) => {
      if (message.id === "__thinking__") {
        return <ThinkingBubble />;
      }

      const isCurrentStreaming =
        message.role === "assistant" &&
        lastSeenStreamingMessageIdRef.current === message.id;
      const isEmptyAssistant =
        message.role === "assistant" &&
        !message.parts.some(
          (part) => part.type === "text" && (part as { text: string }).text.trim(),
        );

      return (
        <MessageRow
          message={message}
          animate={!skipEntryAnimationIds.current.has(message.id)}
          isStreaming={isCurrentStreaming}
          isThinking={isThinking && isEmptyAssistant && isCurrentStreaming}
        />
      );
    },
    [isThinking],
  );

  const computeItemKey = useCallback(
    (_: number, message: UIMessage) => message.id,
    [],
  );

  return (
    <main className={`${uiFont.variable} flex h-full min-h-0 flex-col bg-[var(--surface)] [font-family:var(--font-chat-ui)]`}>
      <header className="flex items-center justify-between gap-3 border-b border-[var(--border)]/40 bg-gradient-to-b from-white/95 to-white/80 backdrop-blur-2xl px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
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
                className="w-full max-w-xs rounded-full border border-[var(--border)]/50 bg-white/90 backdrop-blur-sm px-4 py-2 text-sm font-medium text-[var(--text-primary)] outline-none transition-all duration-200 focus:border-[var(--brand)]/50 focus:ring-1 focus:ring-[var(--brand)]/20"
              />
              <button
                type="button"
                onClick={() => void handleSaveTitle()}
                disabled={!titleDraft.trim()}
                className="shrink-0 rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--brand-strong)] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[var(--brand)]/20 transition-all duration-200 hover:shadow-lg hover:shadow-[var(--brand)]/25 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
                {chatTitle || "Untitled Chat"}
              </p>
              <button
                type="button"
                onClick={startEditTitle}
                aria-label="Rename chat"
                className="shrink-0 rounded-full p-2 text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--surface-muted)] hover:text-[var(--brand)] active:scale-90"
              >
                <EditIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className={`hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors duration-300 ${
            isLocalCacheReady
              ? "bg-emerald-50/80 text-emerald-600 ring-1 ring-emerald-200/60"
              : "bg-amber-50/80 text-amber-600 ring-1 ring-amber-200/60"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              isLocalCacheReady ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
            }`} />
            {isLocalCacheReady ? "Synced" : "Syncing"}
          </div>

          <Link
            href="/admin/history"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)]/40 bg-white/80 backdrop-blur-sm px-3 py-2 text-xs font-medium text-[var(--text-secondary)] shadow-sm transition-all duration-200 hover:bg-[var(--surface-muted)] hover:shadow-md hover:border-[var(--border)]/60 active:scale-95"
          >
            <HistoryIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">History</span>
          </Link>

          <Link
            href="/admin/chat"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--brand-strong)] px-3 py-2 text-xs font-semibold text-white shadow-md shadow-[var(--brand)]/20 transition-all duration-200 hover:shadow-lg hover:shadow-[var(--brand)]/25 hover:scale-105 active:scale-95"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </Link>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto h-full max-w-4xl">
          <Virtuoso
            ref={virtuosoRef}
            className="chat-scroll h-full"
            data={displayMessages}
          initialTopMostItemIndex={Math.max(0, displayMessages.length - 1)}
          defaultItemHeight={72}
          increaseViewportBy={240}
          minOverscanItemCount={6}
          followOutput="smooth"
          computeItemKey={computeItemKey}
          components={virtuosoComponents}
          itemContent={renderItemContent}
          />
        </div>
      </div>

      <form
        className="border-t border-[var(--border)]/40 bg-gradient-to-b from-white/95 to-white/80 backdrop-blur-2xl px-4 py-4 sm:px-6 sm:py-5"
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
          <div className="mx-auto mb-3 flex w-full max-w-4xl flex-wrap gap-2">
            {attachments.map((attachment) => (
              <span
                key={attachment.id}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)]/40 bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs text-[var(--text-secondary)] shadow-sm transition-all duration-200 hover:shadow-md hover:border-[var(--brand)]/30"
              >
                <PaperclipIcon className="h-3.5 w-3.5 text-[var(--brand)]" />
                <span className="max-w-[180px] truncate font-medium text-[var(--text-primary)]">
                  {attachment.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  aria-label={`Remove ${attachment.name}`}
                  className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-muted)] transition-all duration-200 hover:bg-red-50 hover:text-red-500 active:scale-90"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="mx-auto flex w-full max-w-4xl items-end gap-2 rounded-3xl border border-[var(--border)]/50 bg-white/95 backdrop-blur-sm p-2 shadow-lg shadow-black/[0.03] transition-all duration-300 focus-within:border-[var(--brand)]/40 focus-within:shadow-xl focus-within:shadow-[var(--brand)]/[0.06] focus-within:ring-1 focus-within:ring-[var(--brand)]/10">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            aria-label="Attach file"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--surface-muted)] hover:text-[var(--brand)] active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PaperclipIcon className="h-[18px] w-[18px]" />
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
            className="chat-textarea max-h-32 min-h-[44px] w-full flex-1 resize-none bg-transparent px-1 py-2.5 text-[15px] leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]/50"
          />

          <button
            type={isSending ? "button" : "submit"}
            onClick={isSending ? () => stop() : undefined}
            disabled={!isSending && !input.trim() && attachments.length === 0}
            aria-label={isSending ? "Stop generating" : "Send message"}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 ${
              isSending
                ? "bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-500 shadow-sm"
                : "bg-gradient-to-br from-[var(--brand)] to-[var(--brand-strong)] text-white shadow-md shadow-[var(--brand)]/20 hover:shadow-lg hover:shadow-[var(--brand)]/25 hover:scale-105"
            }`}
          >
            {isSending ? (
              <StopIcon className="h-4 w-4" />
            ) : (
              <ArrowUpIcon className="h-[18px] w-[18px]" strokeWidth={2.5} />
            )}
          </button>
        </div>

        <p className="mx-auto mt-2.5 max-w-4xl text-center text-[11px] text-[var(--text-muted)]/60">
          <kbd className="rounded-md border border-[var(--border)]/40 bg-white/60 px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]/80 shadow-sm">
            Shift
          </kbd>
          <span className="mx-1 text-[var(--text-muted)]/40">+</span>
          <kbd className="rounded-md border border-[var(--border)]/40 bg-white/60 px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]/80 shadow-sm">
            Enter
          </kbd>
          <span className="mx-1.5 text-[var(--text-muted)]/30">·</span>
          <span className="text-[var(--text-muted)]/50">Enter to send</span>
          <span className="mx-1.5 text-[var(--text-muted)]/30">·</span>
          <span className="text-[var(--text-muted)]/50">AI can make mistakes</span>
        </p>
      </form>
    </main>
  );
}
