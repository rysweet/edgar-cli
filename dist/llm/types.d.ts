export interface LLMMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    toolResults?: any[];
}
export interface ToolCall {
    name: string;
    parameters: any;
}
export interface LLMResponse {
    content: string;
    toolCalls?: ToolCall[];
}
export interface LLMProvider {
    sendMessage(messages: LLMMessage[]): Promise<LLMResponse>;
}
export interface LLMProviderConfig {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    organizationId?: string;
    organization?: string;
    deploymentName?: string;
    apiVersion?: string;
    endpoint?: string;
}
//# sourceMappingURL=types.d.ts.map