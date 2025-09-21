import { BaseTool, ToolDefinition } from './base-tool';
import { execSync } from 'child_process';
import * as path from 'path';

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

export class GrepTool extends BaseTool {
  public name = 'Grep';
  public description = 'A powerful search tool built on ripgrep for searching file contents';

  public getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'The regular expression pattern to search for'
          },
          path: {
            type: 'string',
            description: 'File or directory to search in (defaults to current directory)'
          },
          glob: {
            type: 'string',
            description: 'Glob pattern to filter files (e.g., "*.js")'
          },
          type: {
            type: 'string',
            description: 'File type to search (e.g., "js", "py", "rust")'
          },
          output_mode: {
            type: 'string',
            enum: ['content', 'files_with_matches', 'count'],
            description: 'Output mode (default: files_with_matches)'
          },
          multiline: {
            type: 'boolean',
            description: 'Enable multiline mode'
          },
          '-i': {
            type: 'boolean',
            description: 'Case insensitive search'
          },
          '-n': {
            type: 'boolean',
            description: 'Show line numbers'
          },
          '-A': {
            type: 'number',
            description: 'Lines after match'
          },
          '-B': {
            type: 'number',
            description: 'Lines before match'
          },
          '-C': {
            type: 'number',
            description: 'Lines around match'
          },
          head_limit: {
            type: 'number',
            description: 'Limit output lines'
          }
        },
        required: ['pattern']
      }
    };
  }

  public async execute(parameters: GrepToolParameters): Promise<GrepToolResult> {
    this.validateParameters(parameters, ['pattern']);

    const {
      pattern,
      path: searchPath = '.',
      glob: globPattern,
      type: fileType,
      output_mode = 'files_with_matches',
      multiline = false,
      '-i': caseInsensitive = false,
      '-n': showLineNumbers = false,
      '-A': afterLines,
      '-B': beforeLines,
      '-C': contextLines,
      head_limit
    } = parameters;

    try {
      // Build ripgrep command
      const args: string[] = [];

      // Add pattern
      args.push(`'${pattern.replace(/'/g, "'\\''")}'`);

      // Add path
      args.push(searchPath);

      // Add flags
      if (caseInsensitive) args.push('-i');
      if (multiline) args.push('-U', '--multiline-dotall');
      if (globPattern) args.push('--glob', `'${globPattern}'`);
      if (fileType) args.push('--type', fileType);

      // Output mode specific flags
      if (output_mode === 'files_with_matches') {
        args.push('-l');
      } else if (output_mode === 'count') {
        args.push('-c');
      } else if (output_mode === 'content') {
        if (showLineNumbers) args.push('-n');
        if (afterLines !== undefined) args.push('-A', afterLines.toString());
        if (beforeLines !== undefined) args.push('-B', beforeLines.toString());
        if (contextLines !== undefined) args.push('-C', contextLines.toString());
      }

      // Try ripgrep first, fall back to grep if not available
      let command: string;
      let useRipgrep = true;

      try {
        execSync('which rg', { stdio: 'ignore' });
        command = `rg ${args.join(' ')}`;
      } catch {
        // Fallback to grep (limited functionality)
        useRipgrep = false;
        const grepArgs: string[] = [];
        
        if (caseInsensitive) grepArgs.push('-i');
        if (output_mode === 'files_with_matches') grepArgs.push('-l');
        if (output_mode === 'count') grepArgs.push('-c');
        if (showLineNumbers && output_mode === 'content') grepArgs.push('-n');
        
        grepArgs.push('-r', `'${pattern.replace(/'/g, "'\\''")}'`, searchPath);
        command = `grep ${grepArgs.join(' ')}`;
      }

      // Add head limit if specified
      if (head_limit !== undefined) {
        command += ` | head -${head_limit}`;
      }

      // Execute search
      let output: string;
      try {
        output = execSync(command, {
          encoding: 'utf-8',
          maxBuffer: 1024 * 1024 * 10, // 10MB buffer
          cwd: process.cwd()
        }).toString();
      } catch (error: any) {
        // grep returns non-zero when no matches found
        if (error.status === 1) {
          output = '';
        } else {
          throw error;
        }
      }

      // Parse results based on output mode
      if (output_mode === 'files_with_matches') {
        const files = output.trim().split('\n').filter(f => f.length > 0);
        return {
          files,
          matches: files.length
        };
      } else if (output_mode === 'count') {
        const counts = output.trim().split('\n').filter(l => l.length > 0);
        const totalCount = counts.reduce((sum, line) => {
          const match = line.match(/:(\d+)$/);
          return sum + (match ? parseInt(match[1], 10) : 0);
        }, 0);
        return {
          count: totalCount,
          matches: totalCount
        };
      } else {
        // content mode
        const lines = output.trim().split('\n').filter(l => l.length > 0);
        return {
          content: output.trim(),
          matches: lines.length
        };
      }
    } catch (error: any) {
      throw new Error(`Grep search failed: ${error.message}`);
    }
  }
}