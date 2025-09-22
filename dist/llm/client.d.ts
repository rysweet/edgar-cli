import { ConfigManager } from '../config/config-manager';
export interface LLMMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_call_id?: string;
}
export interface LLMResponse {
    content: string;
    toolCalls?: any[];
    usage?: {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
    };
}
export interface LLMProviderConfig {
    provider: 'anthropic' | 'openai' | 'azure';
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    azureEndpoint?: string;
    azureApiVersion?: string;
    azureDeployment?: string;
    maxTokens?: number;
    temperature?: number;
    maxRetries?: number;
    timeout?: number;
}
export declare class LLMClient {
    private provider;
    private config;
    constructor(config: ConfigManager);
    sendMessage(messages: LLMMessage[]): Promise<LLMResponse>;
    /**
     * Send a simple prompt and get a response
     */
    prompt(prompt: string, systemPrompt?: string): Promise<string>;
    /**
     * Get information about the current provider configuration
     */
    getProviderInfo(): Record<string, any>;
}
//# sourceMappingURL=client.d.ts.map