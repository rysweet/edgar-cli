import { LLMProvider } from '../llm/llm-provider';
import { LLMProviderFactory } from '../llm/llm-provider-factory';
import { ToolManager } from '../tools/tool-manager';
import { HookManager } from '../hooks/hook-manager';
import { OutputStyleManager } from '../output/output-style-manager';
import { ConfigManager } from '../config/config-manager';

export interface ToolCall {
  name: string;
  parameters: any;
}

export interface LoopMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: any[];
}

export class MasterLoop {
  private llmProvider: LLMProvider;
  private toolManager: ToolManager;
  private hookManager: HookManager;
  private outputStyleManager: OutputStyleManager;
  private messageHistory: LoopMessage[] = [];
  private isRunning: boolean = false;

  constructor(
    llmProvider?: LLMProvider,
    toolManager?: ToolManager,
    hookManager?: HookManager,
    outputStyleManager?: OutputStyleManager
  ) {
    this.llmProvider = llmProvider || LLMProviderFactory.create();
    this.toolManager = toolManager || new ToolManager();
    this.hookManager = hookManager || new HookManager(new ConfigManager());
    this.outputStyleManager = outputStyleManager || new OutputStyleManager();
  }

  public async processMessage(userMessage: string, systemPrompt?: string): Promise<string> {
    // Apply output style to system prompt
    const formatter = this.outputStyleManager.getFormatter();
    const styledSystemPrompt = systemPrompt 
      ? formatter.formatSystemPrompt(systemPrompt)
      : formatter.formatSystemPrompt('You are Edgar, an AI coding assistant.');

    // Initialize conversation with system prompt
    this.messageHistory = [
      {
        role: 'system',
        content: styledSystemPrompt
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    // Run the main loop
    const response = await this.runLoop();
    
    // Apply any post-processing from output style
    return formatter.applyStyle(response);
  }

  public async executeTask(task: string): Promise<void> {
    const formatter = this.outputStyleManager.getFormatter();
    const systemPrompt = formatter.formatSystemPrompt('You are Edgar, an AI coding assistant. Complete the following task thoroughly.');
    
    this.messageHistory = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: task
      }
    ];

    await this.runLoop();
  }

  public async executeQuery(query: string): Promise<string> {
    const formatter = this.outputStyleManager.getFormatter();
    const systemPrompt = formatter.formatSystemPrompt('You are Edgar, an AI coding assistant. Answer the following query.');
    
    this.messageHistory = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: query
      }
    ];

    const response = await this.runLoop();
    return formatter.applyStyle(response);
  }

  private async runLoop(): Promise<string> {
    this.isRunning = true;
    let finalResponse = '';

    while (this.isRunning) {
      try {
        // Convert message history to format expected by LLM provider
        const messages = this.messageHistory.map(msg => {
          if (msg.role === 'tool' && msg.toolResults) {
            return {
              role: 'assistant' as const,
              content: `Tool results: ${JSON.stringify(msg.toolResults)}`
            };
          }
          return {
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content
          };
        });

        // Send messages to LLM
        const response = await this.llmProvider.complete(messages);

        // Parse response for tool calls
        const toolCalls = this.parseToolCalls(response);

        if (toolCalls.length > 0) {
          // Add assistant response with tool calls to history
          this.messageHistory.push({
            role: 'assistant',
            content: response,
            toolCalls
          });

          // Execute tools
          const toolResults = await this.executeToolCalls(toolCalls);
          
          // Add tool results to history
          this.messageHistory.push({
            role: 'tool',
            content: 'Tool execution results',
            toolResults
          });
        } else {
          // No more tool calls, save final response and exit loop
          finalResponse = response;
          this.messageHistory.push({
            role: 'assistant',
            content: response
          });
          this.isRunning = false;
        }
      } catch (error) {
        console.error('Error in master loop:', error);
        this.isRunning = false;
        throw error;
      }
    }

    return finalResponse;
  }

  private parseToolCalls(response: string): ToolCall[] {
    const toolCalls: ToolCall[] = [];
    
    // Parse tool calls from response
    // This is a simplified parser - in production, would use more robust parsing
    const toolCallRegex = /<tool_use>(.*?)<\/tool_use>/gs;
    const matches = response.matchAll(toolCallRegex);
    
    for (const match of matches) {
      try {
        const toolData = JSON.parse(match[1]);
        toolCalls.push({
          name: toolData.name,
          parameters: toolData.parameters
        });
      } catch (error) {
        console.error('Failed to parse tool call:', error);
      }
    }
    
    return toolCalls;
  }

  private async executeToolCalls(toolCalls: ToolCall[]): Promise<any[]> {
    const results: any[] = [];

    for (const toolCall of toolCalls) {
      try {
        // Fire pre-tool-use hook
        await this.hookManager.fireHook('PreToolUse', {
          tool: toolCall.name,
          parameters: toolCall.parameters
        });

        // Execute tool
        const result = await this.toolManager.executeTool(
          toolCall.name,
          toolCall.parameters
        );

        results.push(result);

        // Fire post-tool-use hook
        await this.hookManager.fireHook('PostToolUse', {
          tool: toolCall.name,
          parameters: toolCall.parameters,
          result
        });
      } catch (error) {
        console.error(`Error executing tool ${toolCall.name}:`, error);
        results.push({
          error: `Failed to execute tool ${toolCall.name}: ${error}`
        });
      }
    }

    return results;
  }

  public getMessageHistory(): LoopMessage[] {
    return [...this.messageHistory];
  }

  public clearHistory(): void {
    this.messageHistory = [];
  }

  public stop(): void {
    this.isRunning = false;
  }

  public setOutputStyle(styleName: string): boolean {
    return this.outputStyleManager.setActiveStyle(styleName);
  }

  public getOutputStyles(): string[] {
    return this.outputStyleManager.listStyles();
  }
}