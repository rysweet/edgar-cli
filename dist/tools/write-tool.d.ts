import { BaseTool, ToolDefinition } from './base-tool';
export interface WriteToolParameters {
    file_path: string;
    content: string;
    encoding?: 'utf-8' | 'base64';
}
export interface WriteToolResult {
    success: boolean;
    message: string;
    previousContent?: string;
    stats: {
        size: number;
        lines: number;
    };
    metadata: {
        extension: string;
        created: boolean;
        overwritten?: boolean;
    };
}
export declare class WriteTool extends BaseTool {
    name: string;
    description: string;
    private readonly PROTECTED_DIRS;
    getDefinition(): ToolDefinition;
    execute(parameters: WriteToolParameters): Promise<WriteToolResult>;
    private isProtectedPath;
}
//# sourceMappingURL=write-tool.d.ts.map