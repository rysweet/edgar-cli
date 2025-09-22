import { BaseTool, ToolDefinition } from './base-tool';
export interface WebFetchToolParameters {
    url: string;
    prompt: string;
}
export interface WebFetchToolResult {
    content: string;
    metadata: {
        url: string;
        title?: string;
        statusCode: number;
        contentType?: string;
        fetchedAt: string;
    };
}
export declare class WebFetchTool extends BaseTool {
    name: string;
    description: string;
    private cache;
    private cacheTimeout;
    getDefinition(): ToolDefinition;
    execute(parameters: WebFetchToolParameters): Promise<WebFetchToolResult>;
    private processWithPrompt;
    clearCache(): void;
}
//# sourceMappingURL=web-fetch-tool.d.ts.map