import { SubagentType, SubagentConfig, SubagentTask, SubagentResult, SUBAGENT_CONFIGS } from './subagent-types';
import { BaseSubagent } from './base-subagent';
import { GenericSubagent } from './generic-subagent';
import { ToolManager } from '../tools/tool-manager';
import { LLMProvider } from '../llm/llm-provider';
import { LLMProviderFactory } from '../llm/llm-provider-factory';

export class SubagentManager {
  private subagents: Map<SubagentType, BaseSubagent> = new Map();
  private toolManager: ToolManager;
  private llmProvider: LLMProvider;

  constructor(toolManager?: ToolManager, llmProvider?: LLMProvider) {
    this.toolManager = toolManager || new ToolManager();
    this.llmProvider = llmProvider || LLMProviderFactory.create();
    this.initializeSubagents();
  }

  private initializeSubagents(): void {
    // Initialize all subagents with their configurations
    SUBAGENT_CONFIGS.forEach((config, type) => {
      const subagent = this.createSubagent(config);
      this.subagents.set(type, subagent);
    });
  }

  private createSubagent(config: SubagentConfig): BaseSubagent {
    // For now, use GenericSubagent for all types
    // In future, we can create specialized subagent classes
    return new GenericSubagent(config, this.toolManager, this.llmProvider);
  }

  public async executeTask(task: SubagentTask): Promise<SubagentResult> {
    const subagentType = this.parseSubagentType(task.subagent_type);
    const subagent = this.subagents.get(subagentType);
    
    if (!subagent) {
      return {
        success: false,
        message: `Unknown subagent type: ${task.subagent_type}`,
        error: 'Subagent not found'
      };
    }

    console.log(`\n🤖 Launching ${subagent.getName()} subagent...`);
    console.log(`📋 Task: ${task.description}`);
    
    const result = await subagent.execute(task);
    
    if (result.success) {
      console.log(`✅ ${subagent.getName()} completed successfully`);
    } else {
      console.log(`❌ ${subagent.getName()} failed: ${result.error}`);
    }
    
    return result;
  }

  private parseSubagentType(type: string | SubagentType): SubagentType {
    // Handle both string and enum types
    if (typeof type === 'string') {
      // Convert string to SubagentType
      const typeKey = type.toUpperCase().replace(/-/g, '_');
      return (SubagentType as any)[typeKey] || SubagentType.GENERAL_PURPOSE;
    }
    return type;
  }

  public getSubagent(type: SubagentType): BaseSubagent | undefined {
    return this.subagents.get(type);
  }

  public getAllSubagents(): Map<SubagentType, BaseSubagent> {
    return new Map(this.subagents);
  }

  public getAvailableTypes(): SubagentType[] {
    return Array.from(this.subagents.keys());
  }

  public getSubagentInfo(type: SubagentType): SubagentConfig | undefined {
    return SUBAGENT_CONFIGS.get(type);
  }
}