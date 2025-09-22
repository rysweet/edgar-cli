"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMProviderFactory = void 0;
const anthropic_1 = require("./providers/anthropic");
const openai_1 = require("./providers/openai");
const azure_openai_1 = require("./providers/azure-openai");
class LLMProviderFactory {
    static create(providerType, config) {
        const provider = providerType || process.env.LLM_PROVIDER || 'anthropic';
        const providerConfig = {
            temperature: parseFloat(process.env.LLM_TEMPERATURE || '1.0'),
            maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '512000'),
            timeout: parseInt(process.env.LLM_TIMEOUT || '120000'),
            ...config
        };
        switch (provider.toLowerCase()) {
            case 'anthropic':
                return new anthropic_1.AnthropicProvider(providerConfig);
            case 'openai':
                return new openai_1.OpenAIProvider(providerConfig);
            case 'azure':
            case 'azure-openai':
                return new azure_openai_1.AzureOpenAIProvider(providerConfig);
            default:
                throw new Error(`Unknown LLM provider: ${provider}`);
        }
    }
    static getAvailableProviders() {
        return ['anthropic', 'openai', 'azure'];
    }
    static isProviderAvailable(provider) {
        switch (provider.toLowerCase()) {
            case 'anthropic':
                return !!process.env.ANTHROPIC_API_KEY;
            case 'openai':
                return !!process.env.OPENAI_API_KEY;
            case 'azure':
            case 'azure-openai':
                return !!process.env.AZURE_OPENAI_KEY && !!process.env.AZURE_OPENAI_ENDPOINT;
            default:
                return false;
        }
    }
}
exports.LLMProviderFactory = LLMProviderFactory;
//# sourceMappingURL=llm-provider-factory.js.map