import { BaseTool, ToolDefinition } from './base-tool';
export declare class ExitPlanModeTool extends BaseTool {
    name: string;
    description: string;
    getDefinition(): ToolDefinition;
    execute(parameters: any): Promise<any>;
}
//# sourceMappingURL=exit-plan-mode-tool.d.ts.map