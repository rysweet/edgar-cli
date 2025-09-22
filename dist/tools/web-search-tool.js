"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSearchTool = void 0;
const base_tool_1 = require("./base-tool");
const axios_1 = __importDefault(require("axios"));
class WebSearchTool extends base_tool_1.BaseTool {
    name = 'WebSearch';
    description = 'Searches the web and returns relevant results';
    // In production, this would use a real search API (Google, Bing, etc.)
    searchApiKey = process.env.SEARCH_API_KEY || '';
    searchEngineId = process.env.SEARCH_ENGINE_ID || '';
    getDefinition() {
        return {
            name: this.name,
            description: this.description,
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'The search query',
                        minLength: 2
                    },
                    allowed_domains: {
                        type: 'array',
                        description: 'Only include results from these domains',
                        items: { type: 'string' }
                    },
                    blocked_domains: {
                        type: 'array',
                        description: 'Never include results from these domains',
                        items: { type: 'string' }
                    }
                },
                required: ['query']
            }
        };
    }
    async execute(parameters) {
        this.validateParameters(parameters, ['query']);
        const { query, allowed_domains = [], blocked_domains = [] } = parameters;
        try {
            const results = await this.performSearch(query);
            // Filter results based on domain rules
            let filteredResults = results;
            if (allowed_domains.length > 0) {
                filteredResults = filteredResults.filter(result => allowed_domains.some(domain => result.domain.includes(domain)));
            }
            if (blocked_domains.length > 0) {
                filteredResults = filteredResults.filter(result => !blocked_domains.some(domain => result.domain.includes(domain)));
            }
            return {
                results: filteredResults.slice(0, 10), // Limit to 10 results
                query,
                resultCount: filteredResults.length
            };
        }
        catch (error) {
            throw new Error(`Search failed: ${error.message}`);
        }
    }
    async performSearch(query) {
        if (!this.searchApiKey || !this.searchEngineId) {
            throw new Error('Web search requires API configuration. Please set GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID environment variables. ' +
                'Get your API key from https://console.cloud.google.com/ and create a custom search engine at https://cse.google.com/');
        }
        try {
            const response = await axios_1.default.get('https://www.googleapis.com/customsearch/v1', {
                params: {
                    key: this.searchApiKey,
                    cx: this.searchEngineId,
                    q: query,
                    num: 10
                }
            });
            if (response.data.items) {
                return response.data.items.map((item) => ({
                    title: item.title,
                    url: item.link,
                    snippet: item.snippet || '',
                    domain: new URL(item.link).hostname
                }));
            }
            return [];
        }
        catch (error) {
            if (error.response?.status === 403) {
                throw new Error('Google API quota exceeded or invalid API key');
            }
            else if (error.response?.status === 400) {
                throw new Error('Invalid search query or search engine ID');
            }
            throw new Error(`Search API error: ${error.message}`);
        }
    }
}
exports.WebSearchTool = WebSearchTool;
//# sourceMappingURL=web-search-tool.js.map