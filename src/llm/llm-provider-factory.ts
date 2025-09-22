import { LLMProvider, LLMProviderConfig } from './llm-provider';
import { AnthropicProvider } from './providers/anthropic';
import { OpenAIProvider } from './providers/openai';
import { AzureOpenAIProvider } from './providers/azure-openai';

export class LLMProviderFactory {
  public static create(providerType?: string, config?: LLMProviderConfig): LLMProvider {
    const provider = providerType || process.env.LLM_PROVIDER || 'anthropic';
    
    const providerConfig: LLMProviderConfig = {
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '1.0'),
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '512000'),
      timeout: parseInt(process.env.LLM_TIMEOUT || '120000'),
      ...config
    };
    
    switch (provider.toLowerCase()) {
      case 'anthropic':
        return new AnthropicProvider(providerConfig);
      
      case 'openai':
        return new OpenAIProvider(providerConfig);
      
      case 'azure':
      case 'azure-openai':
        return new AzureOpenAIProvider(providerConfig);
      
      default:
        throw new Error(`Unknown LLM provider: ${provider}`);
    }
  }
  
  public static getAvailableProviders(): string[] {
    return ['anthropic', 'openai', 'azure'];
  }
  
  public static isProviderAvailable(provider: string): boolean {
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