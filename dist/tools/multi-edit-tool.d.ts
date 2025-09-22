import { BaseTool, ToolDefinition } from './base-tool';
export declare class MultiEditTool extends BaseTool {
    name: string;
    description: string;
    getDefinition(): ToolDefinition;
    execute(parameters: any): Promise<any>;
}
//# sourceMappingURL=multi-edit-tool.d.ts.map