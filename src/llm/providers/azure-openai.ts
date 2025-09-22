import axios from 'axios';
import { LLMProvider as ILLMProvider, LLMMessage as ILLMMessage, LLMProviderConfig as ILLMProviderConfig } from '../llm-provider';
import { LLMProvider, LLMMessage, LLMResponse, LLMProviderConfig } from '../types';

export class AzureOpenAIProvider implements ILLMProvider, LLMProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private apiVersion: string;
  private maxTokens: number;
  private temperature: number;
  private topP: number;
  private deploymentName: string;
  private config: ILLMProviderConfig;

  constructor(config: LLMProviderConfig & { deploymentName?: string }) {
    this.apiKey = config.apiKey || process.env.AZURE_OPENAI_KEY || process.env.AZURE_OPENAI_API_KEY || '';
    this.deploymentName = config.deploymentName || process.env.AZURE_OPENAI_DEPLOYMENT || '';
    this.model = config.model || process.env.AZURE_OPENAI_MODEL || 'gpt-4';
    this.apiVersion = config.apiVersion || process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';
    this.maxTokens = config.maxTokens || parseInt(process.env.AZURE_OPENAI_MAX_TOKENS || '4096');
    this.temperature = config.temperature ?? 0.7;
    this.topP = config.topP ?? 1.0;
    
    // Azure OpenAI endpoint format: https://<resource-name>.openai.azure.com/
    const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME || '';
    this.baseUrl = config.baseUrl || process.env.AZURE_OPENAI_ENDPOINT || 
                   (resourceName ? `https://${resourceName}.openai.azure.com` : '');
    
    if (!this.apiKey) {
      throw new Error('Azure OpenAI API key is required');
    }
    
    if (!this.baseUrl) {
      throw new Error('Azure OpenAI endpoint is required');
    }
    
    // Only require deployment name if it's not included in the endpoint URL
    if (!this.deploymentName && !this.baseUrl.includes('/openai/deployments/')) {
      throw new Error('Azure OpenAI deployment name is required when not included in endpoint URL');
    }
    
    this.config = {
      apiKey: this.apiKey,
      endpoint: this.baseUrl,
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature
    };
  }

  async complete(messages: ILLMMessage[]): Promise<string> {
    const response = await this.sendMessage(messages as LLMMessage[]);
    return response.content;
  }

  getConfig(): ILLMProviderConfig {
    return this.config;
  }

  async sendMessage(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      // Convert messages to Azure OpenAI format (same as OpenAI)
      const azureMessages = messages.map(msg => {
        if (msg.role === 'tool') {
          return {
            role: 'tool' as const,
            content: msg.content,
            tool_call_id: 'tool_call_' + Date.now()
          };
        }
        return {
          role: msg.role === 'system' ? 'system' : 
                msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        };
      });

      // Azure OpenAI URL - check if endpoint already contains full path
      let url: string;
      if (this.baseUrl.includes('/openai/deployments/')) {
        // Full URL provided (including deployment)
        url = this.baseUrl;
        if (!url.includes('api-version=')) {
          url += url.includes('?') ? `&api-version=${this.apiVersion}` : `?api-version=${this.apiVersion}`;
        }
      } else {
        // Base URL provided, construct full path
        url = `${this.baseUrl}/openai/deployments/${this.deploymentName}/chat/completions?api-version=${this.apiVersion}`;
      }

      const response = await axios.post(
        url,
        {
          messages: azureMessages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          top_p: this.topP,
          tools: this.getToolDefinitions(),
          tool_choice: 'auto'
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return this.parseResponse(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid Azure OpenAI API key');
      }
      if (error.response?.status === 404) {
        throw new Error(`Deployment ${this.deploymentName} not found or not accessible`);
      }
      if (error.response?.status === 429) {
        const retryAfter = error.response?.headers?.['retry-after'];
        throw new Error(`Azure OpenAI API rate limit exceeded${retryAfter ? `. Retry after ${retryAfter} seconds` : ''}`);
      }
      if (error.response?.status === 400) {
        throw new Error(`Azure OpenAI API bad request: ${error.response?.data?.error?.message || 'Invalid request'}`);
      }
      throw new Error(`Azure OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private parseResponse(data: any): LLMResponse {
    const response: LLMResponse = {
      content: '',
      toolCalls: []
    };

    // Parse the first choice
    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error('No response from Azure OpenAI');
    }

    const message = choice.message;
    
    // Extract content
    if (message.content) {
      response.content = message.content;
    }

    // Extract tool calls
    if (message.tool_calls && Array.isArray(message.tool_calls)) {
      response.toolCalls = message.tool_calls.map((toolCall: any) => ({
        name: toolCall.function.name,
        parameters: JSON.parse(toolCall.function.arguments || '{}')
      }));
    }

    return response;
  }

  private getToolDefinitions(): any[] {
    // Azure OpenAI uses the same tool format as OpenAI
    return [
      {
        type: 'function',
        function: {
          name: 'Read',
          description: 'Read a file from the filesystem',
          parameters: {
            type: 'object',
            properties: {
              file_path: { 
                type: 'string', 
                description: 'Absolute path to the file' 
              },
              offset: { 
                type: 'number', 
                description: 'Line offset to start reading from' 
              },
              limit: { 
                type: 'number', 
                description: 'Number of lines to read' 
              }
            },
            required: ['file_path']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'Write',
          description: 'Write content to a file',
          parameters: {
            type: 'object',
            properties: {
              file_path: { 
                type: 'string', 
                description: 'Absolute path to the file' 
              },
              content: { 
                type: 'string', 
                description: 'Content to write to the file' 
              }
            },
            required: ['file_path', 'content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'Edit',
          description: 'Edit a file by replacing strings',
          parameters: {
            type: 'object',
            properties: {
              file_path: { 
                type: 'string', 
                description: 'Absolute path to the file' 
              },
              old_string: { 
                type: 'string', 
                description: 'String to replace in the file' 
              },
              new_string: { 
                type: 'string', 
                description: 'Replacement string' 
              },
              replace_all: { 
                type: 'boolean', 
                description: 'Replace all occurrences' 
              }
            },
            required: ['file_path', 'old_string', 'new_string']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'Bash',
          description: 'Execute a bash command',
          parameters: {
            type: 'object',
            properties: {
              command: { 
                type: 'string', 
                description: 'Command to execute' 
              },
              timeout: { 
                type: 'number', 
                description: 'Timeout in milliseconds' 
              },
              working_directory: { 
                type: 'string', 
                description: 'Working directory for command execution' 
              }
            },
            required: ['command']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'Glob',
          description: 'Search for files matching a pattern',
          parameters: {
            type: 'object',
            properties: {
              pattern: { 
                type: 'string', 
                description: 'Glob pattern to match files' 
              },
              path: { 
                type: 'string', 
                description: 'Directory to search in' 
              }
            },
            required: ['pattern']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'Grep',
          description: 'Search file contents with pattern',
          parameters: {
            type: 'object',
            properties: {
              pattern: { 
                type: 'string', 
                description: 'Search pattern (regex)' 
              },
              path: { 
                type: 'string', 
                description: 'Path to search in' 
              },
              output_mode: { 
                type: 'string', 
                enum: ['content', 'files_with_matches', 'count'],
                description: 'Output format for search results' 
              }
            },
            required: ['pattern']
          }
        }
      }
    ];
  }
}