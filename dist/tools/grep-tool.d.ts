import { BaseTool, ToolDefinition } from './base-tool';
export interface GrepToolParameters {
    pattern: string;
    path?: string;
    glob?: string;
    type?: string;
    output_mode?: 'content' | 'files_with_matches' | 'count';
    multiline?: boolean;
    '-i'?: boolean;
    '-n'?: boolean;
    '-A'?: number;
    '-B'?: number;
    '-C'?: number;
    head_limit?: number;
}
export interface GrepToolResult {
    content?: string;
    files?: string[];
    count?: number;
    matches: number;
}
export declare class GrepTool extends BaseTool {
    name: string;
    description: string;
    getDefinition(): ToolDefinition;
    execute(parameters: GrepToolParameters): Promise<GrepToolResult>;
}
//# sourceMappingURL=grep-tool.d.ts.map