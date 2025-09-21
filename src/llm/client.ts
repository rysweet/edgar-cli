import { ConfigManager } from '../config/config-manager';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { AzureOpenAI } from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

abstract class BaseLLMProvider {
  protected config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  abstract sendMessage(messages: LLMMessage[]): Promise<LLMResponse>;
}

class AnthropicProvider extends BaseLLMProvider {
  private client: Anthropic;

  constructor(config: LLMProviderConfig) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
      baseURL: config.baseUrl,
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 120000,
    });
  }

  async sendMessage(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      // Convert messages to Anthropic format
      const systemMessage = messages.find(m => m.role === 'system');
      const userMessages = messages.filter(m => m.role !== 'system');
      
      const response = await this.client.messages.create({
        model: this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature || 0.7,
        system: systemMessage?.content,
        messages: userMessages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      });

      return {
        content: response.content[0].type === 'text' 
          ? response.content[0].text 
          : JSON.stringify(response.content[0]),
        usage: {
          inputTokens: response.usage?.input_tokens,
          outputTokens: response.usage?.output_tokens,
        }
      };
    } catch (error) {
      console.error('Anthropic API Error:', error);
      throw new Error(`Failed to get response from Anthropic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

class OpenAIProvider extends BaseLLMProvider {
  private client: OpenAI;

  constructor(config: LLMProviderConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      baseURL: config.baseUrl,
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 120000,
    });
  }

  async sendMessage(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      // Convert messages to OpenAI format
      const openAIMessages = messages.map(msg => {
        if (msg.role === 'tool') {
          return {
            role: 'tool' as const,
            content: msg.content,
            tool_call_id: msg.tool_call_id || 'tool_call_' + Date.now()
          };
        }
        return {
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        };
      });

      const response = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4-turbo-preview',
        messages: openAIMessages as any,
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature || 0.7,
      });

      const choice = response.choices[0];
      
      return {
        content: choice.message.content || '',
        toolCalls: choice.message.tool_calls,
        usage: {
          inputTokens: response.usage?.prompt_tokens,
          outputTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens,
        }
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error(`Failed to get response from OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

class AzureOpenAIProvider extends BaseLLMProvider {
  private client: AzureOpenAI;

  constructor(config: LLMProviderConfig) {
    super(config);
    
    if (!config.azureEndpoint) {
      throw new Error('Azure OpenAI endpoint is required');
    }
    
    if (!config.apiKey) {
      throw new Error('Azure OpenAI API key is required');
    }

    // Parse the endpoint URL to extract the deployment name if not provided
    let deployment = config.azureDeployment;
    let endpoint = config.azureEndpoint;
    
    if (!deployment && endpoint.includes('/deployments/')) {
      const match = endpoint.match(/\/deployments\/([^\/]+)/);
      if (match) {
        deployment = match[1];
        // Extract base endpoint without deployment path
        endpoint = endpoint.split('/openai/deployments/')[0];
      }
    }

    this.client = new AzureOpenAI({
      endpoint: endpoint,
      apiKey: config.apiKey,
      apiVersion: config.azureApiVersion || '2024-02-15-preview',
      deployment: deployment || 'gpt-4',
    });
  }

  async sendMessage(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        messages: messages.map(msg => ({
          role: msg.role as any,
          content: msg.content
        })),
        model: this.config.model || this.config.azureDeployment || 'gpt-4',
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature || 0.7,
      });

      const choice = response.choices[0];
      
      return {
        content: choice.message?.content || '',
        toolCalls: choice.message?.tool_calls,
        usage: {
          inputTokens: response.usage?.prompt_tokens,
          outputTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens,
        }
      };
    } catch (error) {
      console.error('Azure OpenAI API Error:', error);
      throw new Error(`Failed to get response from Azure OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export class LLMClient {
  private provider: BaseLLMProvider;
  private config: ConfigManager;

  constructor(config: ConfigManager) {
    this.config = config;
    
    // Get provider configuration
    const providerName = (config.get<string>('provider') || process.env.LLM_PROVIDER || 'anthropic').toLowerCase();
    
    const providerConfig: LLMProviderConfig = {
      provider: providerName as any,
      apiKey: config.get<string>('apiKey'),
      baseUrl: config.get<string>('baseUrl'),
      model: config.get<string>('model'),
      azureEndpoint: config.get<string>('azureEndpoint'),
      azureApiVersion: config.get<string>('azureApiVersion'),
      azureDeployment: config.get<string>('azureDeployment'),
      maxTokens: config.get<number>('maxTokens'),
      temperature: config.get<number>('temperature'),
      maxRetries: config.get<number>('maxRetries'),
      timeout: config.get<number>('timeout'),
    };

    // Create the appropriate provider
    switch (providerName) {
      case 'anthropic':
        this.provider = new AnthropicProvider(providerConfig);
        break;
      case 'openai':
        this.provider = new OpenAIProvider(providerConfig);
        break;
      case 'azure':
      case 'azure-openai':
        this.provider = new AzureOpenAIProvider(providerConfig);
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${providerName}. Supported: anthropic, openai, azure`);
    }

    console.log(`Using LLM provider: ${providerName}`);
  }

  public async sendMessage(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      return await this.provider.sendMessage(messages);
    } catch (error) {
      console.error('Error sending message to LLM:', error);
      
      // Provide a fallback response in development mode
      if (process.env.NODE_ENV === 'development') {
        console.warn('Falling back to mock response in development mode');
        return {
          content: `[Development Mode] Mock response - Real LLM call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          toolCalls: []
        };
      }
      
      throw error;
    }
  }

  /**
   * Send a simple prompt and get a response
   */
  public async prompt(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: LLMMessage[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });
    
    const response = await this.sendMessage(messages);
    return response.content;
  }

  /**
   * Get information about the current provider configuration
   */
  public getProviderInfo(): Record<string, any> {
    const provider = this.config.get<string>('provider') || 'anthropic';
    const model = this.config.get<string>('model');
    
    return {
      provider,
      model,
      maxTokens: this.config.get<number>('maxTokens'),
      temperature: this.config.get<number>('temperature'),
      configSource: this.config.getConfigPaths().configDirName,
    };
  }
}