export { AnthropicProvider } from './anthropic';
export { OpenAIProvider } from './openai';
export { AzureOpenAIProvider } from './azure-openai';
export type { LLMProvider, LLMMessage, LLMResponse, ToolCall, LLMProviderConfig } from '../types';
export declare const PROVIDERS: {
    readonly anthropic: () => Promise<typeof import("./anthropic").AnthropicProvider>;
    readonly openai: () => Promise<typeof import("./openai").OpenAIProvider>;
    readonly 'azure-openai': () => Promise<typeof import("./azure-openai").AzureOpenAIProvider>;
    readonly azure: () => Promise<typeof import("./azure-openai").AzureOpenAIProvider>;
};
export type ProviderName = keyof typeof PROVIDERS;
/**
 * Create a provider instance by name
 * @param name - The provider name
 * @param config - The provider configuration
 * @returns A promise that resolves to the provider instance
 */
export declare function createProvider(name: ProviderName, config: import('../types').LLMProviderConfig & {
    deploymentName?: string;
}): Promise<import('../types').LLMProvider>;
/**
 * Get a provider class by name (synchronous)
 * @param name - The provider name
 * @returns The provider class or undefined
 */
export declare function getProviderClass(name: string): any;
//# sourceMappingURL=index.d.ts.map