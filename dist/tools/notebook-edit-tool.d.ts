import { BaseTool, ToolDefinition } from './base-tool';
export declare class NotebookEditTool extends BaseTool {
    name: string;
    description: string;
    getDefinition(): ToolDefinition;
    execute(parameters: any): Promise<any>;
}
//# sourceMappingURL=notebook-edit-tool.d.ts.map