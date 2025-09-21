import { BaseTool, ToolDefinition } from './base-tool';
import { glob } from 'glob';
import * as path from 'path';
import * as fs from 'fs-extra';

export interface GlobToolParameters {
  pattern: string;
  path?: string;
}

export interface GlobToolResult {
  files: string[];
  count: number;
}

export class GlobTool extends BaseTool {
  public name = 'Glob';
  public description = 'Fast file pattern matching tool that works with any codebase size';

  public getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'The glob pattern to match files against (e.g., "**/*.js", "src/**/*.ts")'
          },
          path: {
            type: 'string',
            description: 'The directory to search in (defaults to current working directory)'
          }
        },
        required: ['pattern']
      }
    };
  }

  public async execute(parameters: GlobToolParameters): Promise<GlobToolResult> {
    this.validateParameters(parameters, ['pattern']);

    const { pattern, path: searchPath = process.cwd() } = parameters;

    try {
      // Change to the search directory to make glob patterns relative
      const originalCwd = process.cwd();
      const absoluteSearchPath = path.isAbsolute(searchPath) ? searchPath : path.join(originalCwd, searchPath);

      if (!fs.existsSync(absoluteSearchPath)) {
        throw new Error(`Directory not found: ${absoluteSearchPath}`);
      }

      process.chdir(absoluteSearchPath);

      // Execute glob search
      const files = await glob(pattern, {
        dot: true, // Include dotfiles
        ignore: ['**/node_modules/**', '**/.git/**'], // Ignore common directories
      });

      // Convert to absolute paths and sort by modification time
      const absoluteFiles = files
        .map(file => path.join(absoluteSearchPath, file))
        .sort((a, b) => {
          try {
            const statA = fs.statSync(a);
            const statB = fs.statSync(b);
            return statB.mtime.getTime() - statA.mtime.getTime();
          } catch {
            return 0;
          }
        });

      // Restore original working directory
      process.chdir(originalCwd);

      return {
        files: absoluteFiles,
        count: absoluteFiles.length
      };
    } catch (error: any) {
      throw new Error(`Glob search failed: ${error.message}`);
    }
  }
}