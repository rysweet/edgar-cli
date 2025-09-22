import { BaseTool, ToolDefinition } from './base-tool';
export interface WebSearchToolParameters {
    query: string;
    allowed_domains?: string[];
    blocked_domains?: string[];
}
export interface WebSearchToolResult {
    results: SearchResult[];
    query: string;
    resultCount: number;
}
export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    domain: string;
}
export declare class WebSearchTool extends BaseTool {
    name: string;
    description: string;
    private searchApiKey;
    private searchEngineId;
    getDefinition(): ToolDefinition;
    execute(parameters: WebSearchToolParameters): Promise<WebSearchToolResult>;
    private performSearch;
}
//# sourceMappingURL=web-search-tool.d.ts.map