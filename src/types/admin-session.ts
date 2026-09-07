export type Session = {
  session_id: string;

  request_count: number;

  input_tokens: number;
  output_tokens: number;
  total_tokens: number;

  tool_calls: number;
  error_count: number;

  started_at: string;
  last_activity: string;

  first_user_message: string | null;
};

export type ConversationRequest = {
  id: string;
  session_id: string;

  model: string;

  user_message: string | null;
  assistant_response: string | null;

  input_tokens: number;
  output_tokens: number;
  total_tokens: number;

  tool_calls: number;

  response_time_ms: number | null;

  status: "completed" | "error" | string;

  error_message: string | null;

  created_at: string;
};

export type SessionDetail = {
  session_id: string;

  request_count: number;

  input_tokens: number;
  output_tokens: number;
  total_tokens: number;

  tool_calls: number;
  errors: number;

  response_time_ms: number;

  started_at: string;
  last_activity: string;
};