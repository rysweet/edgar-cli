import { BaseTool, ToolDefinition } from './base-tool';

export class ExitPlanModeTool extends BaseTool {
  public name = 'ExitPlanMode';
  public description = 'Exit plan mode and proceed with implementation';

  public getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          plan: {
            type: 'string',
            description: 'The plan to execute after exiting plan mode'
          }
        },
        required: ['plan']
      }
    };
  }

  public async execute(parameters: any): Promise<any> {
    this.validateParameters(parameters, ['plan']);
    
    const { plan } = parameters;
    
    // In a real implementation, this would signal the master loop
    // to exit plan mode and start executing the plan
    console.log('\n📋 Exiting plan mode with the following plan:');
    console.log('-------------------------------------------');
    console.log(plan);
    console.log('-------------------------------------------\n');
    
    return {
      success: true,
      message: 'Exited plan mode',
      plan: plan,
      mode: 'execution'
    };
  }
}