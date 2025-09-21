import { BaseTool, ToolDefinition } from './base-tool';
import axios from 'axios';

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

export class WebSearchTool extends BaseTool {
  public name = 'WebSearch';
  public description = 'Searches the web and returns relevant results';

  // In production, this would use a real search API (Google, Bing, etc.)
  private searchApiKey: string = process.env.SEARCH_API_KEY || '';
  private searchEngineId: string = process.env.SEARCH_ENGINE_ID || '';

  public getDefinition(): ToolDefinition {
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

  public async execute(parameters: WebSearchToolParameters): Promise<WebSearchToolResult> {
    this.validateParameters(parameters, ['query']);

    const { query, allowed_domains = [], blocked_domains = [] } = parameters;

    try {
      // For demo purposes, return mock results
      // In production, this would call a real search API
      const results = await this.performSearch(query);

      // Filter results based on domain rules
      let filteredResults = results;

      if (allowed_domains.length > 0) {
        filteredResults = filteredResults.filter(result => 
          allowed_domains.some(domain => result.domain.includes(domain))
        );
      }

      if (blocked_domains.length > 0) {
        filteredResults = filteredResults.filter(result =>
          !blocked_domains.some(domain => result.domain.includes(domain))
        );
      }

      return {
        results: filteredResults.slice(0, 10), // Limit to 10 results
        query,
        resultCount: filteredResults.length
      };
    } catch (error: any) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  private async performSearch(query: string): Promise<SearchResult[]> {
    // Mock implementation
    // In production, this would call Google Custom Search API or similar
    if (this.searchApiKey && this.searchEngineId) {
      try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: this.searchApiKey,
            cx: this.searchEngineId,
            q: query,
            num: 10
          }
        });

        if (response.data.items) {
          return response.data.items.map((item: any) => ({
            title: item.title,
            url: item.link,
            snippet: item.snippet || '',
            domain: new URL(item.link).hostname
          }));
        }
      } catch (error) {
        console.error('Search API error:', error);
        // Fall back to mock results
      }
    }

    // Mock results for development
    return this.getMockResults(query);
  }

  private getMockResults(query: string): SearchResult[] {
    const mockResults: SearchResult[] = [
      {
        title: `Documentation for ${query}`,
        url: `https://docs.example.com/${query.replace(/\s+/g, '-')}`,
        snippet: `Comprehensive documentation about ${query} including examples and best practices.`,
        domain: 'docs.example.com'
      },
      {
        title: `${query} - Wikipedia`,
        url: `https://en.wikipedia.org/wiki/${query.replace(/\s+/g, '_')}`,
        snippet: `${query} is a topic that has various applications and meanings...`,
        domain: 'en.wikipedia.org'
      },
      {
        title: `Getting Started with ${query}`,
        url: `https://www.tutorial.com/${query.replace(/\s+/g, '-')}`,
        snippet: `Learn how to get started with ${query} in this comprehensive tutorial.`,
        domain: 'www.tutorial.com'
      },
      {
        title: `Stack Overflow - Questions tagged [${query}]`,
        url: `https://stackoverflow.com/questions/tagged/${query.replace(/\s+/g, '-')}`,
        snippet: `Questions and answers about ${query} from the developer community.`,
        domain: 'stackoverflow.com'
      },
      {
        title: `GitHub - ${query} repositories`,
        url: `https://github.com/search?q=${encodeURIComponent(query)}`,
        snippet: `Find open source projects related to ${query} on GitHub.`,
        domain: 'github.com'
      }
    ];

    return mockResults;
  }
}