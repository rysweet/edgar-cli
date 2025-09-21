import { ConfigManager } from '../config/config-manager';
import { LLMClient } from '../llm/client';
import { ToolManager } from '../tools/tool-manager';
import { HookManager } from '../hooks/hook-manager';

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
  private config: ConfigManager;
  private llmClient: LLMClient;
  private toolManager: ToolManager;
  private hookManager: HookManager;
  private messageHistory: LoopMessage[] = [];
  private isRunning: boolean = false;

  constructor(_config: ConfigManager) {
    this.config = _config;
    this.llmClient = new LLMClient(_config);
    this.toolManager = new ToolManager();
    this.hookManager = new HookManager(_config);
  }

  public async executeTask(task: string): Promise<void> {
    this.messageHistory.push({
      role: 'user',
      content: task
    });

    await this.runLoop();
  }

  public async executeQuery(query: string): Promise<string> {
    this.messageHistory.push({
      role: 'user',
      content: query
    });

    const response = await this.llmClient.sendMessage(this.messageHistory);
    
    this.messageHistory.push({
      role: 'assistant',
      content: response.content
    });

    return response.content;
  }

  private async runLoop(): Promise<void> {
    this.isRunning = true;

    while (this.isRunning) {
      try {
        // Send messages to LLM
        const response = await this.llmClient.sendMessage(this.messageHistory);

        // Add assistant response to history
        this.messageHistory.push({
          role: 'assistant',
          content: response.content,
          toolCalls: response.toolCalls
        });

        // Check for tool calls
        if (response.toolCalls && response.toolCalls.length > 0) {
          // Execute tools
          const toolResults = await this.executeToolCalls(response.toolCalls);
          
          // Add tool results to history
          this.messageHistory.push({
            role: 'tool',
            content: 'Tool execution results',
            toolResults
          });
        } else {
          // No more tool calls, exit loop
          this.isRunning = false;
        }
      } catch (error) {
        console.error('Error in master loop:', error);
        this.isRunning = false;
        throw error;
      }
    }
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
}