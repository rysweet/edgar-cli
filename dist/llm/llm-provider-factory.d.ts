import { LLMProvider, LLMProviderConfig } from './llm-provider';
export declare class LLMProviderFactory {
    static create(providerType?: string, config?: LLMProviderConfig): LLMProvider;
    static getAvailableProviders(): string[];
    static isProviderAvailable(provider: string): boolean;
}
//# sourceMappingURL=llm-provider-factory.d.ts.map