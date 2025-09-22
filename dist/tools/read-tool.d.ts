import { BaseTool, ToolDefinition } from './base-tool';
export interface ReadToolParameters {
    file_path: string;
    offset?: number;
    limit?: number;
}
export interface ReadToolResult {
    content: string;
    metadata?: {
        truncated?: boolean;
        totalLines?: number;
        isBinary?: boolean;
        isImage?: boolean;
        isNotebook?: boolean;
        cellCount?: number;
        mimeType?: string;
    };
}
export declare class ReadTool extends BaseTool {
    name: string;
    description: string;
    private readonly DEFAULT_LIMIT;
    private readonly MAX_LINE_LENGTH;
    getDefinition(): ToolDefinition;
    execute(parameters: ReadToolParameters): Promise<ReadToolResult>;
    private isBinaryFile;
    private getMimeType;
    private readNotebook;
}
//# sourceMappingURL=read-tool.d.ts.map