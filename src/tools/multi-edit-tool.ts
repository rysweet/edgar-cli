import { BaseTool, ToolDefinition } from './base-tool';
import * as fs from 'fs-extra';
import * as path from 'path';

interface EditOperation {
  old_string: string;
  new_string: string;
  replace_all?: boolean;
}

export class MultiEditTool extends BaseTool {
  public name = 'MultiEdit';
  public description = 'Make multiple edits to a single file in one operation';

  public getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'The absolute path to the file to modify'
          },
          edits: {
            type: 'array',
            description: 'Array of edit operations to perform sequentially',
            items: {
              type: 'object',
              properties: {
                old_string: {
                  type: 'string',
                  description: 'The text to replace'
                },
                new_string: {
                  type: 'string',
                  description: 'The text to replace it with'
                },
                replace_all: {
                  type: 'boolean',
                  description: 'Replace all occurrences (default false)'
                }
              },
              required: ['old_string', 'new_string']
            }
          }
        },
        required: ['file_path', 'edits']
      }
    };
  }

  public async execute(parameters: any): Promise<any> {
    this.validateParameters(parameters, ['file_path', 'edits']);
    
    const { file_path, edits } = parameters;
    const absolutePath = path.resolve(file_path);
    
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }
    
    let content = fs.readFileSync(absolutePath, 'utf-8');
    let changesMade = 0;
    
    for (const edit of edits) {
      const { old_string, new_string, replace_all = false } = edit;
      
      if (old_string === new_string) {
        continue;
      }
      
      if (replace_all) {
        const count = (content.match(new RegExp(old_string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        content = content.split(old_string).join(new_string);
        changesMade += count;
      } else {
        if (content.includes(old_string)) {
          content = content.replace(old_string, new_string);
          changesMade++;
        }
      }
    }
    
    fs.writeFileSync(absolutePath, content, 'utf-8');
    
    return {
      success: true,
      message: `Applied ${changesMade} edits to ${absolutePath}`,
      changes_made: changesMade
    };
  }
}