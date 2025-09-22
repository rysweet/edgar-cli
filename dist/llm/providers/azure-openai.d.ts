import { LLMProvider as ILLMProvider, LLMMessage as ILLMMessage, LLMProviderConfig as ILLMProviderConfig } from '../llm-provider';
import { LLMProvider, LLMMessage, LLMResponse, LLMProviderConfig } from '../types';
export declare class AzureOpenAIProvider implements ILLMProvider, LLMProvider {
    private apiKey;
    private model;
    private baseUrl;
    private apiVersion;
    private maxTokens;
    private temperature;
    private topP;
    private deploymentName;
    private config;
    constructor(config: LLMProviderConfig & {
        deploymentName?: string;
    });
    complete(messages: ILLMMessage[]): Promise<string>;
    getConfig(): ILLMProviderConfig;
    sendMessage(messages: LLMMessage[]): Promise<LLMResponse>;
    private parseResponse;
    private getToolDefinitions;
}
//# sourceMappingURL=azure-openai.d.ts.map