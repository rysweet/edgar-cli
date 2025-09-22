import { LLMProvider as ILLMProvider, LLMMessage as ILLMMessage, LLMProviderConfig as ILLMProviderConfig } from '../llm-provider';
import { LLMProvider, LLMMessage, LLMResponse, LLMProviderConfig } from '../types';
export declare class AnthropicProvider implements ILLMProvider, LLMProvider {
    private apiKey;
    private model;
    private baseUrl;
    private maxTokens;
    private config;
    constructor(config: LLMProviderConfig);
    complete(messages: ILLMMessage[]): Promise<string>;
    getConfig(): ILLMProviderConfig;
    sendMessage(messages: LLMMessage[]): Promise<LLMResponse>;
    private parseResponse;
    private getToolDefinitions;
}
//# sourceMappingURL=anthropic.d.ts.map