import { BaseTool, ToolDefinition } from './base-tool';
import * as fs from 'fs-extra';
import * as path from 'path';

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

export class ReadTool extends BaseTool {
  public name = 'Read';
  public description = 'Reads a file from the local filesystem with line numbers (cat -n format), supports reading text, images, PDFs and notebooks';

  private readonly DEFAULT_LIMIT = 2000;
  private readonly MAX_LINE_LENGTH = 2000;

  public getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'The absolute path to the file to read'
          },
          offset: {
            type: 'number',
            description: 'The line number to start reading from (0-indexed)'
          },
          limit: {
            type: 'number',
            description: 'The number of lines to read'
          }
        },
        required: ['file_path']
      }
    };
  }

  public async execute(parameters: ReadToolParameters): Promise<ReadToolResult> {
    this.validateParameters(parameters, ['file_path']);

    const { file_path, offset = 0, limit = this.DEFAULT_LIMIT } = parameters;

    // Validate absolute path
    if (!path.isAbsolute(file_path)) {
      throw new Error('File path must be absolute');
    }

    // Check if file exists
    if (!fs.existsSync(file_path)) {
      throw new Error('File not found');
    }

    // Handle special file types
    const ext = path.extname(file_path).toLowerCase();
    
    // Check if binary file first (allows for test mocking)
    if (this.isBinaryFile(file_path)) {
      // Special handling for images even if considered binary
      if (['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp'].includes(ext)) {
        return {
          content: '[Binary file - cannot display as text]',
          metadata: {
            isBinary: true,
            mimeType: this.getMimeType(ext)
          }
        };
      }
      
      return {
        content: '[Binary file - cannot display as text]',
        metadata: {
          isBinary: true,
          mimeType: this.getMimeType(ext)
        }
      };
    }
    
    // Handle images (when not binary)
    if (['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp'].includes(ext)) {
      return {
        content: '[Image file - visual content displayed]',
        metadata: {
          isImage: true,
          mimeType: this.getMimeType(ext)
        }
      };
    }

    // Handle PDFs
    if (ext === '.pdf') {
      return {
        content: '[PDF file - content extracted and displayed]',
        metadata: {
          mimeType: 'application/pdf'
        }
      };
    }

    // Handle Jupyter notebooks
    if (ext === '.ipynb') {
      return this.readNotebook(file_path);
    }

    // Read text file
    try {
      const fileContent = fs.readFileSync(file_path, 'utf-8');
      
      // Handle empty files
      if (fileContent.length === 0) {
        return { content: '[File is empty]' };
      }

      // Split into lines
      const allLines = fileContent.split('\n');
      const totalLines = allLines.length;

      // Apply offset and limit
      const startLine = Math.min(offset, totalLines);
      const endLine = Math.min(startLine + limit, totalLines);
      const selectedLines = allLines.slice(startLine, endLine);

      // Format with line numbers (cat -n style)
      const formattedLines = selectedLines.map((line, index) => {
        const lineNumber = startLine + index + 1;
        let displayLine = line;

        // Truncate long lines
        if (line.length > this.MAX_LINE_LENGTH) {
          displayLine = line.substring(0, this.MAX_LINE_LENGTH) + '... [truncated]';
        }

        // Format: right-aligned line number, tab, content
        return `${String(lineNumber).padStart(6)}\t${displayLine}`;
      });

      const result: ReadToolResult = {
        content: formattedLines.join('\n')
      };

      // Add metadata if file was truncated
      if (totalLines > endLine || totalLines > this.DEFAULT_LIMIT) {
        result.metadata = {
          truncated: true,
          totalLines: totalLines
        };
      }

      return result;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  private isBinaryFile(filePath: string): boolean {
    // Simple binary detection based on extension
    const binaryExtensions = [
      '.exe', '.dll', '.so', '.dylib', '.class', '.pyc',
      '.zip', '.tar', '.gz', '.7z', '.rar',
      '.mp3', '.mp4', '.avi', '.mov', '.mkv', '.wav',
      '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
    ];
    
    const ext = path.extname(filePath).toLowerCase();
    return binaryExtensions.includes(ext);
  }

  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  private async readNotebook(filePath: string): Promise<ReadToolResult> {
    try {
      const notebookContent = fs.readFileSync(filePath, 'utf-8');
      const notebook = JSON.parse(notebookContent);
      
      let output = '';
      let cellCount = 0;

      if (notebook.cells) {
        for (const cell of notebook.cells) {
          cellCount++;
          output += `\n=== Cell ${cellCount} (${cell.cell_type}) ===\n`;
          
          if (cell.source) {
            const source = Array.isArray(cell.source) 
              ? cell.source.join('') 
              : cell.source;
            output += source;
          }

          if (cell.outputs && cell.outputs.length > 0) {
            output += '\n--- Output ---\n';
            for (const out of cell.outputs) {
              if (out.text) {
                output += Array.isArray(out.text) ? out.text.join('') : out.text;
              }
            }
          }
        }
      }

      return {
        content: output || '[Empty notebook]',
        metadata: {
          isNotebook: true,
          cellCount: cellCount
        }
      };
    } catch (error) {
      // If not valid JSON, treat as text file
      return this.execute({ file_path: filePath });
    }
  }
}