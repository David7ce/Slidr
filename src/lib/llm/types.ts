export type LlmMode = "http";

export interface LlmConfig {
  baseURL: string;
  apiKey: string;
  model: string;
}

export interface LlmMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
}

export interface LlmToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LlmTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface LlmStreamEvent {
  type: "token" | "tool_call" | "result" | "error";
  text?: string;
  toolCall?: LlmToolCall;
  error?: string;
}

export const PROVIDER_PRESETS: Array<{
  id: string;
  label: string;
  baseURL: string;
  model: string;
  free?: boolean;
}> = [
  { id: "groq", label: "Groq (Free)", baseURL: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile", free: true },
  { id: "google", label: "Google AI Studio (Free)", baseURL: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.0-flash", free: true },
  { id: "openrouter", label: "OpenRouter (Free tier)", baseURL: "https://openrouter.ai/api/v1", model: "meta-llama/llama-3.3-70b-instruct:free", free: true },
  { id: "openai", label: "OpenAI", baseURL: "https://api.openai.com/v1", model: "gpt-4o" },
  { id: "anthropic", label: "Anthropic (Claude)", baseURL: "https://api.anthropic.com/v1/", model: "claude-sonnet-4-20250514" },
  { id: "deepseek", label: "DeepSeek", baseURL: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  { id: "ollama", label: "Ollama (Local)", baseURL: "http://localhost:11434/v1", model: "llama3.3" },
  { id: "lmstudio", label: "LM Studio (Local)", baseURL: "http://localhost:1234/v1", model: "local-model" },
];

export const DEFAULT_CONFIG: LlmConfig = {
  baseURL: "",
  apiKey: "",
  model: "",
};
