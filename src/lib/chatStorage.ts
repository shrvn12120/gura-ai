"use client";

export type ChatRole = "user" | "assistant" | "system";

export type StoredMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

type ChatStorageState = {
  messages: StoredMessage[];
  conversationId: string | null;
  interactionId: string | null;
};

const STORAGE_KEY = "guraidhoo:chat";
const MAX_MESSAGES = 30;

function emptyState(): ChatStorageState {
  return {
    messages: [],
    conversationId: null,
    interactionId: null,
  };
}

/**
 * Read the complete chat state from localStorage.
 */
export function getChatState(): ChatStorageState {
  if (typeof window === "undefined") {
    return emptyState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return emptyState();
    }

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return emptyState();
    }

    const messages = Array.isArray(parsed.messages)
      ? parsed.messages.filter(
          (message: any) =>
            message &&
            typeof message.id === "string" &&
            typeof message.content === "string" &&
            ["user", "assistant", "system"].includes(message.role)
        )
      : [];

    const conversationId =
      typeof parsed.conversationId === "string"
        ? parsed.conversationId
        : null;

    const interactionId =
      typeof parsed.interactionId === "string"
        ? parsed.interactionId
        : null;

    return {
      messages,
      conversationId,
      interactionId,
    };
  } catch (error) {
    console.error("Failed to read chat from localStorage:", error);
    return emptyState();
  }
}

/**
 * Save complete chat state.
 */
export function saveChatState(state: ChatStorageState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const trimmedMessages = state.messages.slice(-MAX_MESSAGES);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        messages: trimmedMessages,
        conversationId: state.conversationId ?? null,
        interactionId: state.interactionId ?? null,
      })
    );
  } catch (error) {
    console.error("Failed to save chat to localStorage:", error);
  }
}

/**
 * Get only the stored messages.
 */
export function getConversation(): StoredMessage[] {
  return getChatState().messages;
}

/**
 * Save only messages while preserving the existing IDs.
 */
export function saveConversation(messages: StoredMessage[]): void {
  const state = getChatState();

  saveChatState({
    messages,
    conversationId: state.conversationId,
    interactionId: state.interactionId,
  });
}

/**
 * Add one message.
 */
export function appendMessage(message: StoredMessage): void {
  const state = getChatState();

  saveChatState({
    messages: [...state.messages, message],
    conversationId: state.conversationId,
    interactionId: state.interactionId,
  });
}

/**
 * Set the OpenAI conversation ID.
 */
export function saveConversationId(conversationId: string | null): void {
  const state = getChatState();

  saveChatState({
    messages: state.messages,
    conversationId,
    interactionId: state.interactionId,
  });
}

/**
 * Get OpenAI conversation ID.
 */
export function getConversationId(): string | null {
  return getChatState().conversationId;
}

/**
 * Set the Gemini interaction ID.
 */
export function saveInteractionId(interactionId: string | null, conversationId: string | null,): void {
  const state = getChatState();

  saveChatState({
    messages: state.messages,
    conversationId: conversationId,
    interactionId,
  });
}

/**
 * Get Gemini interaction ID.
 */
export function getInteractionId(): string | null {
  return getChatState().interactionId;
}

/**
 * Delete the entire local conversation.
 */
export function deleteConversation(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to delete chat:", error);
  }
}

/**
 * Generate a stable client-side message ID.
 */
export function createMessageId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function saveConversationIds(params: {
  conversationId?: string | null;
  interactionId?: string | null;
}) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const state = getChatState();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        messages: state.messages.slice(-MAX_MESSAGES),
        conversationId:
          params.conversationId ?? state.conversationId ?? null,
        interactionId:
          params.interactionId ?? state.interactionId ?? null,
      }),
    );
  } catch (error) {
    console.error("Failed to persist conversation IDs:", error);
  }
}