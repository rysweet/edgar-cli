import { BaseTool, ToolDefinition } from './base-tool';
export interface GlobToolParameters {
    pattern: string;
    path?: string;
}
export interface GlobToolResult {
    files: string[];
    count: number;
}
export declare class GlobTool extends BaseTool {
    name: string;
    description: string;
    getDefinition(): ToolDefinition;
    execute(parameters: GlobToolParameters): Promise<GlobToolResult>;
}
//# sourceMappingURL=glob-tool.d.ts.map