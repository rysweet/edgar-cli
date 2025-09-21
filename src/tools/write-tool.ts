import { BaseTool, ToolDefinition } from './base-tool';
import * as fs from 'fs-extra';
import * as path from 'path';

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

export class WriteTool extends BaseTool {
  public name = 'Write';
  public description = 'Writes content to a file, creating it if it does not exist or overwriting if it does';

  // System directories that should not be written to
  private readonly PROTECTED_DIRS = ['/etc', '/bin', '/sbin', '/usr/bin', '/usr/sbin', '/boot', '/sys', '/proc'];

  public getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'The absolute path to the file to write'
          },
          content: {
            type: 'string',
            description: 'The content to write to the file'
          }
        },
        required: ['file_path', 'content']
      }
    };
  }

  public async execute(parameters: WriteToolParameters): Promise<WriteToolResult> {
    this.validateParameters(parameters, ['file_path', 'content']);

    const { file_path, content, encoding = 'utf-8' } = parameters;

    // Validate absolute path
    if (!path.isAbsolute(file_path)) {
      throw new Error('File path must be absolute');
    }

    // Check for system directories
    if (this.isProtectedPath(file_path)) {
      throw new Error('Cannot write to system directory');
    }

    // Prepare directory
    const dir = path.dirname(file_path);
    fs.ensureDirSync(dir);

    // Check if file exists and read previous content
    let previousContent: string | undefined;
    let previousMode: number | undefined;
    let isOverwrite = false;

    if (fs.existsSync(file_path)) {
      isOverwrite = true;
      try {
        previousContent = fs.readFileSync(file_path, 'utf-8');
        const stats = fs.statSync(file_path);
        previousMode = stats.mode;
      } catch (error) {
        // File exists but cannot be read - will still try to overwrite
      }
    }

    try {
      // Write the file
      if (encoding === 'base64') {
        fs.writeFileSync(file_path, Buffer.from(content, 'base64'));
      } else {
        fs.writeFileSync(file_path, content, 'utf-8');
      }

      // Preserve file permissions if overwriting
      if (previousMode !== undefined) {
        fs.chmodSync(file_path, previousMode);
      }

      // Calculate statistics
      const lines = content ? content.split('\n').length : 0;
      const size = Buffer.byteLength(content, encoding as BufferEncoding);

      // Prepare result message
      let message: string;
      if (content === '') {
        message = `File ${isOverwrite ? 'overwritten with' : 'created as'} empty file: ${file_path}`;
      } else if (isOverwrite) {
        message = `File overwritten: ${file_path}`;
      } else {
        message = `File created: ${file_path}`;
      }

      const result: WriteToolResult = {
        success: true,
        message,
        stats: {
          size,
          lines
        },
        metadata: {
          extension: path.extname(file_path),
          created: !isOverwrite,
          overwritten: isOverwrite
        }
      };

      if (previousContent !== undefined) {
        result.previousContent = previousContent;
      }

      return result;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  private isProtectedPath(filePath: string): boolean {
    const normalizedPath = path.normalize(filePath);
    
    return this.PROTECTED_DIRS.some(protectedDir => {
      return normalizedPath.startsWith(protectedDir + path.sep) || 
             normalizedPath === protectedDir;
    });
  }
}