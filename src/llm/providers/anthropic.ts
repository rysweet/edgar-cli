import axios from 'axios';
import { LLMProvider as ILLMProvider, LLMMessage as ILLMMessage, LLMProviderConfig as ILLMProviderConfig } from '../llm-provider';
import { LLMProvider, LLMMessage, LLMResponse, ToolCall, LLMProviderConfig } from '../types';

export class AnthropicProvider implements ILLMProvider, LLMProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string = 'https://api.anthropic.com/v1';
  private maxTokens: number;
  private config: ILLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.model = config.model || process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229';
    this.maxTokens = config.maxTokens || parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096');
    
    this.config = {
      apiKey: this.apiKey,
      model: this.model,
      maxTokens: this.maxTokens
    };
    
    if (!this.apiKey) {
      throw new Error('Anthropic API key is required');
    }
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
      // Convert messages to Anthropic format
      const systemMessage = messages.find(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');

      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: this.model,
          messages: conversationMessages.map(msg => ({
            role: msg.role === 'tool' ? 'assistant' : msg.role,
            content: msg.content
          })),
          max_tokens: this.maxTokens,
          system: systemMessage?.content,
          tools: this.getToolDefinitions()
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          }
        }
      );

      return this.parseResponse(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid Anthropic API key');
      }
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  private parseResponse(data: any): LLMResponse {
    const response: LLMResponse = {
      content: '',
      toolCalls: []
    };

    // Parse content and tool calls from Anthropic response
    if (data.content) {
      for (const block of data.content) {
        if (block.type === 'text') {
          response.content += block.text;
        } else if (block.type === 'tool_use') {
          response.toolCalls?.push({
            name: block.name,
            parameters: block.input
          });
        }
      }
    }

    return response;
  }

  private getToolDefinitions(): any[] {
    return [
      {
        name: 'Read',
        description: 'Read a file from the filesystem',
        input_schema: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Absolute path to the file' },
            offset: { type: 'number', description: 'Line offset' },
            limit: { type: 'number', description: 'Number of lines to read' }
          },
          required: ['file_path']
        }
      },
      {
        name: 'Write',
        description: 'Write content to a file',
        input_schema: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Absolute path to the file' },
            content: { type: 'string', description: 'Content to write' }
          },
          required: ['file_path', 'content']
        }
      },
      {
        name: 'Edit',
        description: 'Edit a file by replacing strings',
        input_schema: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Absolute path to the file' },
            old_string: { type: 'string', description: 'String to replace' },
            new_string: { type: 'string', description: 'Replacement string' },
            replace_all: { type: 'boolean', description: 'Replace all occurrences' }
          },
          required: ['file_path', 'old_string', 'new_string']
        }
      },
      {
        name: 'Bash',
        description: 'Execute a bash command',
        input_schema: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'Command to execute' },
            timeout: { type: 'number', description: 'Timeout in milliseconds' },
            working_directory: { type: 'string', description: 'Working directory' }
          },
          required: ['command']
        }
      },
      {
        name: 'Glob',
        description: 'Search for files matching a pattern',
        input_schema: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: 'Glob pattern' },
            path: { type: 'string', description: 'Search directory' }
          },
          required: ['pattern']
        }
      },
      {
        name: 'Grep',
        description: 'Search file contents with pattern',
        input_schema: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: 'Search pattern' },
            path: { type: 'string', description: 'Search path' },
            output_mode: { type: 'string', enum: ['content', 'files_with_matches', 'count'] }
          },
          required: ['pattern']
        }
      }
    ];
  }
}