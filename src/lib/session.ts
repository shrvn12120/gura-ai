const SESSION_KEY = "session_id";
const CONVERSATION_KEY =
  "conversation_id";

export function getSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  let sessionId =
    localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = crypto.randomUUID();

    localStorage.setItem(
      SESSION_KEY,
      sessionId
    );
  }

  return sessionId;
}

export function getConversationId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(
    CONVERSATION_KEY
  );
}

export function clearConversationId() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    CONVERSATION_KEY
  );
}

export function clearChatSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    SESSION_KEY
  );

  localStorage.removeItem(
    CONVERSATION_KEY
  );
}