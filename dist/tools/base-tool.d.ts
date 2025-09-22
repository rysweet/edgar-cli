export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
    };
}
export declare abstract class BaseTool {
    abstract name: string;
    abstract description: string;
    abstract getDefinition(): ToolDefinition;
    abstract execute(parameters: any): Promise<any>;
    protected validateParameters(parameters: any, required?: string[]): void;
}
//# sourceMappingURL=base-tool.d.ts.map