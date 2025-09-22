import { BaseTool } from './base-tool';
export declare class ToolManager {
    private tools;
    constructor();
    private initializeTools;
    executeTool(name: string, parameters: any): Promise<any>;
    registerTool(name: string, tool: BaseTool): void;
    hasTool(name: string): boolean;
    getAllTools(): Map<string, BaseTool>;
}
//# sourceMappingURL=tool-manager.d.ts.map