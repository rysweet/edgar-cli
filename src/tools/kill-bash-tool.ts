import { BaseTool, ToolDefinition } from './base-tool';
import { BashProcessManager } from './bash-output-tool';

export class KillBashTool extends BaseTool {
  public name = 'KillBash';
  public description = 'Kill a running background bash shell by its ID';
  private manager = BashProcessManager.getInstance();

  public getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          shell_id: {
            type: 'string',
            description: 'The ID of the background shell to kill'
          }
        },
        required: ['shell_id']
      }
    };
  }

  public async execute(parameters: any): Promise<any> {
    this.validateParameters(parameters, ['shell_id']);
    
    const { shell_id } = parameters;
    const process = this.manager.getProcess(shell_id);
    
    if (!process) {
      return {
        success: false,
        message: `No background shell found with ID: ${shell_id}`
      };
    }
    
    try {
      this.manager.removeProcess(shell_id);
      return {
        success: true,
        message: `Background shell ${shell_id} terminated`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to kill shell: ${error.message}`
      };
    }
  }
}