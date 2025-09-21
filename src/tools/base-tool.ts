export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export abstract class BaseTool {
  public abstract name: string;
  public abstract description: string;
  
  public abstract getDefinition(): ToolDefinition;
  public abstract execute(parameters: any): Promise<any>;
  
  protected validateParameters(parameters: any, required: string[] = []): void {
    for (const param of required) {
      if (!(param in parameters)) {
        throw new Error(`Missing required parameter: ${param}`);
      }
    }
  }
}