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
  interactionId: string | null;
};

const STORAGE_KEY = "guraidhoo:chat";
const MAX_MESSAGES = 30;

function emptyState(): ChatStorageState {
  return {
    messages: [],
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

    const interactionId =
      typeof parsed.interactionId === "string"
        ? parsed.interactionId
        : null;

    return {
      messages,
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
        interactionId: state.interactionId,
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
 * Save only messages while preserving the existing interaction ID.
 */
export function saveConversation(messages: StoredMessage[]): void {
  const state = getChatState();

  saveChatState({
    messages,
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
    interactionId: state.interactionId,
  });
}

/**
 * Set the Gemini Interactions API conversation ID.
 */
export function saveInteractionId(interactionId: string | null): void {
  const state = getChatState();

  saveChatState({
    messages: state.messages,
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