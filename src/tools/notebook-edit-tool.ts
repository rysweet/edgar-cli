import { BaseTool, ToolDefinition } from './base-tool';
import * as fs from 'fs-extra';
import * as path from 'path';

export class NotebookEditTool extends BaseTool {
  public name = 'NotebookEdit';
  public description = 'Edit Jupyter notebook cells';

  public getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          notebook_path: {
            type: 'string',
            description: 'The absolute path to the Jupyter notebook file'
          },
          cell_id: {
            type: 'string',
            description: 'The ID of the cell to edit'
          },
          cell_type: {
            type: 'string',
            enum: ['code', 'markdown'],
            description: 'The type of the cell'
          },
          edit_mode: {
            type: 'string',
            enum: ['replace', 'insert', 'delete'],
            description: 'The type of edit to make'
          },
          new_source: {
            type: 'string',
            description: 'The new source for the cell'
          }
        },
        required: ['notebook_path', 'new_source']
      }
    };
  }

  public async execute(parameters: any): Promise<any> {
    this.validateParameters(parameters, ['notebook_path', 'new_source']);
    
    const { notebook_path, cell_id, cell_type, edit_mode = 'replace', new_source } = parameters;
    const absolutePath = path.resolve(notebook_path);
    
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Notebook not found: ${absolutePath}`);
    }
    
    const notebook = fs.readJsonSync(absolutePath);
    
    if (!notebook.cells) {
      throw new Error('Invalid notebook format: no cells array');
    }
    
    if (edit_mode === 'insert') {
      const newCell = {
        cell_type: cell_type || 'code',
        metadata: {},
        source: new_source.split('\n').map((line: string, i: number, arr: string[]) => 
          i === arr.length - 1 ? line : line + '\n'
        )
      };
      
      if (cell_id) {
        const index = notebook.cells.findIndex((c: any) => c.id === cell_id);
        if (index >= 0) {
          notebook.cells.splice(index + 1, 0, newCell);
        } else {
          notebook.cells.unshift(newCell);
        }
      } else {
        notebook.cells.push(newCell);
      }
    } else if (edit_mode === 'delete') {
      if (cell_id) {
        const index = notebook.cells.findIndex((c: any) => c.id === cell_id);
        if (index >= 0) {
          notebook.cells.splice(index, 1);
        }
      }
    } else {
      // Replace mode
      if (cell_id) {
        const cell = notebook.cells.find((c: any) => c.id === cell_id);
        if (cell) {
          cell.source = new_source.split('\n').map((line: string, i: number, arr: string[]) => 
            i === arr.length - 1 ? line : line + '\n'
          );
          if (cell_type) {
            cell.cell_type = cell_type;
          }
        }
      } else if (notebook.cells.length > 0) {
        // Edit first cell if no ID specified
        notebook.cells[0].source = new_source.split('\n').map((line: string, i: number, arr: string[]) => 
          i === arr.length - 1 ? line : line + '\n'
        );
        if (cell_type) {
          notebook.cells[0].cell_type = cell_type;
        }
      }
    }
    
    fs.writeJsonSync(absolutePath, notebook, { spaces: 2 });
    
    return {
      success: true,
      message: `Notebook edited: ${absolutePath}`,
      edit_mode: edit_mode
    };
  }
}