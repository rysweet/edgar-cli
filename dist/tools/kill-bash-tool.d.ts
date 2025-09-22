import { BaseTool, ToolDefinition } from './base-tool';
export declare class KillBashTool extends BaseTool {
    name: string;
    description: string;
    private manager;
    getDefinition(): ToolDefinition;
    execute(parameters: any): Promise<any>;
}
//# sourceMappingURL=kill-bash-tool.d.ts.map