// Export all LLM providers
export { AnthropicProvider } from './anthropic';
export { OpenAIProvider } from './openai';
export { AzureOpenAIProvider } from './azure-openai';

// Re-export types for convenience
export type { 
  LLMProvider, 
  LLMMessage, 
  LLMResponse, 
  ToolCall,
  LLMProviderConfig 
} from '../types';

// Provider registry for dynamic provider selection
export const PROVIDERS = {
  anthropic: () => import('./anthropic').then(m => m.AnthropicProvider),
  openai: () => import('./openai').then(m => m.OpenAIProvider),
  'azure-openai': () => import('./azure-openai').then(m => m.AzureOpenAIProvider),
  azure: () => import('./azure-openai').then(m => m.AzureOpenAIProvider), // Alias
} as const;

export type ProviderName = keyof typeof PROVIDERS;

/**
 * Create a provider instance by name
 * @param name - The provider name
 * @param config - The provider configuration
 * @returns A promise that resolves to the provider instance
 */
export async function createProvider(
  name: ProviderName, 
  config: import('../types').LLMProviderConfig & { deploymentName?: string }
): Promise<import('../types').LLMProvider> {
  const ProviderClass = await PROVIDERS[name]();
  return new ProviderClass(config);
}

/**
 * Get a provider class by name (synchronous)
 * @param name - The provider name
 * @returns The provider class or undefined
 */
export function getProviderClass(name: string): any {
  switch (name.toLowerCase()) {
    case 'anthropic':
      return require('./anthropic').AnthropicProvider;
    case 'openai':
      return require('./openai').OpenAIProvider;
    case 'azure-openai':
    case 'azure':
      return require('./azure-openai').AzureOpenAIProvider;
    default:
      return undefined;
  }
}