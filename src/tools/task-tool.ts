import { BaseTool, ToolDefinition } from './base-tool';
import { SubagentManager } from '../subagents/subagent-manager';
import { SubagentTask, SubagentResult, SubagentType } from '../subagents/subagent-types';

export interface TaskToolParameters {
  description: string;
  prompt: string;
  subagent_type: string;
}

export class TaskTool extends BaseTool {
  public name = 'Task';
  public description = 'Launch a specialized subagent to handle complex, multi-step tasks autonomously';
  
  private subagentManager?: SubagentManager;

  constructor(subagentManager?: SubagentManager) {
    super();
    // Don't create SubagentManager here to avoid circular dependency
    this.subagentManager = subagentManager;
  }
  
  private getSubagentManager(): SubagentManager {
    if (!this.subagentManager) {
      // Lazy initialization to avoid circular dependency
      this.subagentManager = new SubagentManager();
    }
    return this.subagentManager;
  }

  public getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'A short (3-5 word) description of the task'
          },
          prompt: {
            type: 'string',
            description: 'The detailed task for the agent to perform'
          },
          subagent_type: {
            type: 'string',
            description: 'The type of specialized agent to use for this task',
            enum: [
              'general-purpose',
              'builder',
              'architect',
              'reviewer',
              'tester',
              'optimizer',
              'database',
              'security',
              'api-designer',
              'ci-diagnostic',
              'cleanup',
              'patterns',
              'prompt-writer',
              'analyzer',
              'integration',
              'improvement-workflow',
              'ambiguity',
              'preference-reviewer',
              'pre-commit-diagnostic',
              'output-style-setup',
              'statusline-setup'
            ]
          }
        },
        required: ['description', 'prompt', 'subagent_type']
      }
    };
  }

  public async execute(parameters: TaskToolParameters): Promise<SubagentResult> {
    this.validateParameters(parameters, ['description', 'prompt', 'subagent_type']);

    const task: SubagentTask = {
      description: parameters.description,
      prompt: parameters.prompt,
      subagent_type: parameters.subagent_type as SubagentType
    };

    try {
      const result = await this.getSubagentManager().executeTask(task);
      return result;
    } catch (error: any) {
      return {
        success: false,
        message: `Task execution failed: ${error.message}`,
        error: error.message
      };
    }
  }

  public setSubagentManager(manager: SubagentManager): void {
    this.subagentManager = manager;
  }
}