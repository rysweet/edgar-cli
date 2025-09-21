import { BaseTool, ToolDefinition } from './base-tool';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

export class WebFetchTool extends BaseTool {
  public name = 'WebFetch';
  public description = 'Fetches content from a URL and processes it with a prompt';

  private cache: Map<string, { content: string; fetchedAt: Date }> = new Map();
  private cacheTimeout = 15 * 60 * 1000; // 15 minutes

  public getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            format: 'uri',
            description: 'The URL to fetch content from'
          },
          prompt: {
            type: 'string',
            description: 'The prompt to run on the fetched content'
          }
        },
        required: ['url', 'prompt']
      }
    };
  }

  public async execute(parameters: WebFetchToolParameters): Promise<WebFetchToolResult> {
    this.validateParameters(parameters, ['url', 'prompt']);

    let { url, prompt } = parameters;

    // Upgrade HTTP to HTTPS
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }

    // Check cache
    const cacheKey = `${url}:${prompt}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      const age = Date.now() - cached.fetchedAt.getTime();
      if (age < this.cacheTimeout) {
        return JSON.parse(cached.content);
      } else {
        this.cache.delete(cacheKey);
      }
    }

    try {
      // Fetch the URL
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Edgar-CLI/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500
      });

      // Handle redirects
      if (response.status >= 300 && response.status < 400) {
        const redirectUrl = response.headers.location;
        if (redirectUrl && new URL(redirectUrl).host !== new URL(url).host) {
          return {
            content: `REDIRECT DETECTED: The URL redirects to a different host.\nOriginal URL: ${url}\nRedirect URL: ${redirectUrl}\nStatus: ${response.status}`,
            metadata: {
              url,
              statusCode: response.status,
              fetchedAt: new Date().toISOString()
            }
          };
        }
      }

      // Convert HTML to markdown-like text
      let content = response.data;
      const contentType = response.headers['content-type'] || '';

      if (contentType.includes('text/html')) {
        const $ = cheerio.load(response.data);
        
        // Remove script and style elements
        $('script, style, noscript').remove();
        
        // Extract title
        const title = $('title').text() || $('h1').first().text();
        
        // Get main content
        const mainContent = $('main').html() || $('article').html() || $('body').html();
        
        // Convert to text
        if (mainContent) {
          const $content = cheerio.load(mainContent);
          content = $content.text().replace(/\s+/g, ' ').trim();
        }
        
        // Truncate if too long
        if (content.length > 50000) {
          content = content.substring(0, 50000) + '...[truncated]';
        }
        
        // Process with prompt (in real implementation, this would use LLM)
        const processedContent = this.processWithPrompt(content, prompt);
        
        const result: WebFetchToolResult = {
          content: processedContent,
          metadata: {
            url,
            title,
            statusCode: response.status,
            contentType,
            fetchedAt: new Date().toISOString()
          }
        };

        // Cache the result
        this.cache.set(cacheKey, {
          content: JSON.stringify(result),
          fetchedAt: new Date()
        });

        return result;
      } else {
        // Non-HTML content
        return {
          content: `Content type ${contentType} fetched. Raw content length: ${content.length} bytes`,
          metadata: {
            url,
            statusCode: response.status,
            contentType,
            fetchedAt: new Date().toISOString()
          }
        };
      }
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Connection refused to ${url}`);
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error(`Request to ${url} timed out`);
      } else if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
      } else {
        throw new Error(`Failed to fetch URL: ${error.message}`);
      }
    }
  }

  private processWithPrompt(content: string, prompt: string): string {
    // In a real implementation, this would call the LLM
    // For now, return a summary
    const lines = content.split('.').slice(0, 5).join('.') + '.';
    return `Based on the prompt "${prompt}":\n\n${lines}\n\n[Full content would be processed by LLM]`;
  }

  public clearCache(): void {
    this.cache.clear();
  }
}