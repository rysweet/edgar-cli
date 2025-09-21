import { BaseTool, ToolDefinition } from './base-tool';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface EditToolParameters {
  file_path: string;
  old_string: string;
  new_string: string;
  replace_all?: boolean;
}

export interface EditToolResult {
  success: boolean;
  message: string;
  replacements: number;
  lineNumbers: number[];
  preview: {
    before: string;
    after: string;
  };
}

export class EditTool extends BaseTool {
  public name = 'Edit';
  public description = 'Performs exact string replacements in files. Edit will fail if old_string is not unique unless replace_all is true';

  public getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'The absolute path to the file to edit'
          },
          old_string: {
            type: 'string',
            description: 'The exact string to replace'
          },
          new_string: {
            type: 'string',
            description: 'The string to replace it with'
          },
          replace_all: {
            type: 'boolean',
            description: 'Replace all occurrences (default: false)',
            default: false
          }
        },
        required: ['file_path', 'old_string', 'new_string']
      }
    };
  }

  public async execute(parameters: EditToolParameters): Promise<EditToolResult> {
    this.validateParameters(parameters, ['file_path', 'old_string', 'new_string']);

    const { file_path, old_string, new_string, replace_all = false } = parameters;

    // Validate absolute path
    if (!path.isAbsolute(file_path)) {
      throw new Error('File path must be absolute');
    }

    // Check if file exists
    if (!fs.existsSync(file_path)) {
      throw new Error('File not found');
    }

    // Validate that old and new strings are different
    if (old_string === new_string) {
      throw new Error('old_string and new_string cannot be the same');
    }

    try {
      // Read the file
      const content = fs.readFileSync(file_path, 'utf-8');
      
      // Count occurrences
      const occurrences = this.countOccurrences(content, old_string);
      
      if (occurrences === 0) {
        throw new Error('String not found in file');
      }

      // Check uniqueness if not replacing all
      if (!replace_all && occurrences > 1) {
        throw new Error(`String appears ${occurrences} times in file. Use replace_all or provide more context`);
      }

      // Find line numbers where replacements will occur
      const lineNumbers = this.findLineNumbers(content, old_string, replace_all);

      // Perform replacement
      let newContent: string;
      if (replace_all) {
        newContent = this.replaceAll(content, old_string, new_string);
      } else {
        // Replace only first occurrence
        const index = content.indexOf(old_string);
        newContent = content.substring(0, index) + new_string + content.substring(index + old_string.length);
      }

      // Get file permissions before writing
      const stats = fs.statSync(file_path);
      const mode = stats.mode;

      // Write the modified content
      fs.writeFileSync(file_path, newContent, 'utf-8');

      // Preserve file permissions
      fs.chmodSync(file_path, mode);

      // Create preview
      const preview = this.createPreview(content, newContent, old_string, new_string);

      return {
        success: true,
        message: `Successfully replaced ${replace_all ? occurrences : 1} occurrence(s) in ${file_path}`,
        replacements: replace_all ? occurrences : 1,
        lineNumbers,
        preview
      };
    } catch (error: any) {
      if (error.message.includes('String not found') || 
          error.message.includes('appears') || 
          error.message.includes('cannot be the same')) {
        throw error;
      }
      throw new Error(`Failed to edit file: ${error.message}`);
    }
  }

  private countOccurrences(content: string, searchString: string): number {
    let count = 0;
    let index = content.indexOf(searchString);
    
    while (index !== -1) {
      count++;
      index = content.indexOf(searchString, index + searchString.length);
    }
    
    return count;
  }

  private replaceAll(content: string, oldString: string, newString: string): string {
    // Use split/join for exact string replacement (not regex)
    return content.split(oldString).join(newString);
  }

  private findLineNumbers(content: string, searchString: string, findAll: boolean): number[] {
    const lines = content.split('\n');
    const lineNumbers: number[] = [];
    let currentPos = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineStart = currentPos;
      const lineEnd = currentPos + line.length;

      // Check if the search string appears in this line's range
      let searchPos = content.indexOf(searchString, lineStart);
      
      while (searchPos !== -1 && searchPos <= lineEnd) {
        if (searchPos >= lineStart && searchPos <= lineEnd) {
          lineNumbers.push(i + 1); // Line numbers are 1-indexed
          if (!findAll) {
            return lineNumbers;
          }
        }
        searchPos = content.indexOf(searchString, searchPos + searchString.length);
        if (searchPos > lineEnd) break;
      }

      currentPos = lineEnd + 1; // +1 for the newline character
    }

    return lineNumbers;
  }

  private createPreview(
    originalContent: string, 
    newContent: string,
    oldString: string,
    newString: string
  ): { before: string; after: string } {
    // Find the first occurrence in the original content
    const index = originalContent.indexOf(oldString);
    
    if (index === -1) {
      return { before: '', after: '' };
    }

    // Get context around the change (50 chars before and after)
    const contextLength = 50;
    const beforeStart = Math.max(0, index - contextLength);
    const afterEnd = Math.min(originalContent.length, index + oldString.length + contextLength);

    const beforeContext = originalContent.substring(beforeStart, index);
    const afterContext = originalContent.substring(index + oldString.length, afterEnd);

    return {
      before: `${beforeStart > 0 ? '...' : ''}${beforeContext}${oldString}${afterContext}${afterEnd < originalContent.length ? '...' : ''}`,
      after: `${beforeStart > 0 ? '...' : ''}${beforeContext}${newString}${afterContext}${afterEnd < originalContent.length ? '...' : ''}`
    };
  }
}