import { BaseSubagent } from './base-subagent';
import { SubagentTask, SubagentResult, SubagentConfig } from './subagent-types';

export class GenericSubagent extends BaseSubagent {
  public async execute(task: SubagentTask): Promise<SubagentResult> {
    try {
      // Build the full prompt with task context
      const fullPrompt = this.buildTaskPrompt(task);
      
      // Execute the task using the master loop
      const result = await this.runTask(fullPrompt);
      
      return {
        success: true,
        message: `Task completed by ${this.getName()}`,
        output: result
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Task failed: ${error.message}`,
        error: error.message
      };
    }
  }

  private buildTaskPrompt(task: SubagentTask): string {
    let prompt = `# Task Description\n${task.description}\n\n`;
    prompt += `# Task Instructions\n${task.prompt}\n\n`;
    prompt += `# Important Notes\n`;
    prompt += `- You are operating as a ${this.getName()} subagent\n`;
    prompt += `- Focus on your specialized area of expertise\n`;
    prompt += `- Complete the task thoroughly and return clear results\n`;
    
    if (this.config.tools && !this.config.tools.includes('*')) {
      prompt += `- You have access to these tools: ${this.config.tools.join(', ')}\n`;
    }
    
    return prompt;
  }
}