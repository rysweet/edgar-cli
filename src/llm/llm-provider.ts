export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMProviderConfig {
  apiKey?: string;
  endpoint?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface LLMProvider {
  complete(messages: LLMMessage[]): Promise<string>;
  stream?(messages: LLMMessage[], onChunk: (chunk: string) => void): Promise<void>;
  getConfig(): LLMProviderConfig;
}