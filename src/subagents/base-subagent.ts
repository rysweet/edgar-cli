import { SubagentType, SubagentConfig, SubagentTask, SubagentResult } from './subagent-types';
import { ToolManager } from '../tools/tool-manager';
import { LLMProvider } from '../llm/llm-provider';
import { MasterLoop } from '../core/master-loop-v2';

export abstract class BaseSubagent {
  protected config: SubagentConfig;
  protected toolManager: ToolManager;
  protected llmProvider: LLMProvider;
  
  constructor(config: SubagentConfig, toolManager: ToolManager, llmProvider: LLMProvider) {
    this.config = config;
    this.toolManager = toolManager;
    this.llmProvider = llmProvider;
  }

  public abstract execute(task: SubagentTask): Promise<SubagentResult>;

  protected async runTask(prompt: string): Promise<any> {
    // Create a scoped master loop for this subagent
    const masterLoop = new MasterLoop(this.llmProvider, this.toolManager);
    
    // Build the system prompt with subagent specialization
    const systemPrompt = this.buildSystemPrompt();
    
    // Execute the task
    const result = await masterLoop.processMessage(prompt, systemPrompt);
    
    return result;
  }

  protected buildSystemPrompt(): string {
    let prompt = `You are a specialized ${this.config.name} agent.\n`;
    prompt += `Description: ${this.config.description}\n`;
    
    if (this.config.philosophy) {
      prompt += `Philosophy: ${this.config.philosophy}\n`;
    }
    
    if (this.config.specializations) {
      prompt += `Specializations: ${this.config.specializations.join(', ')}\n`;
    }
    
    if (!this.config.tools.includes('*')) {
      prompt += `Available tools: ${this.config.tools.join(', ')}\n`;
    }
    
    prompt += '\nFollow your specialization and complete the assigned task thoroughly.';
    
    return prompt;
  }

  protected filterToolsForSubagent(): string[] {
    if (this.config.tools.includes('*')) {
      return Array.from(this.toolManager.getAllTools().keys());
    }
    return this.config.tools;
  }

  public getType(): SubagentType {
    return this.config.type;
  }

  public getName(): string {
    return this.config.name;
  }

  public getDescription(): string {
    return this.config.description;
  }
}