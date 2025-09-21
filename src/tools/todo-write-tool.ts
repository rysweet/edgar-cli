import { BaseTool, ToolDefinition } from './base-tool';
import * as fs from 'fs-extra';
import * as path from 'path';
import { getConfigDir } from '../config/path-utils';

export interface Todo {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm: string;
}

export interface TodoWriteToolParameters {
  todos: Todo[];
}

export interface TodoWriteToolResult {
  success: boolean;
  message: string;
  todoCount: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
  };
}

export class TodoWriteTool extends BaseTool {
  public name = 'TodoWrite';
  public description = 'Create and manage a structured task list for tracking progress';

  private todoFilePath: string;

  constructor() {
    super();
    const configDir = getConfigDir();
    this.todoFilePath = path.join(configDir.projectPath, 'todos.json');
  }

  public getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          todos: {
            type: 'array',
            description: 'Array of todo items',
            items: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'The task description'
                },
                status: {
                  type: 'string',
                  enum: ['pending', 'in_progress', 'completed'],
                  description: 'Current status of the task'
                },
                activeForm: {
                  type: 'string',
                  description: 'Present continuous form of the task'
                }
              },
              required: ['content', 'status', 'activeForm']
            }
          }
        },
        required: ['todos']
      }
    };
  }

  public async execute(parameters: TodoWriteToolParameters): Promise<TodoWriteToolResult> {
    this.validateParameters(parameters, ['todos']);

    const { todos } = parameters;

    try {
      // Validate todos
      for (const todo of todos) {
        if (!todo.content || !todo.status || !todo.activeForm) {
          throw new Error('Each todo must have content, status, and activeForm');
        }
        if (!['pending', 'in_progress', 'completed'].includes(todo.status)) {
          throw new Error(`Invalid status: ${todo.status}`);
        }
      }

      // Ensure only one task is in_progress at a time
      const inProgressCount = todos.filter(t => t.status === 'in_progress').length;
      if (inProgressCount > 1) {
        throw new Error('Only one task can be in_progress at a time');
      }

      // Save todos to file
      const dir = path.dirname(this.todoFilePath);
      fs.ensureDirSync(dir);
      fs.writeJsonSync(this.todoFilePath, todos, { spaces: 2 });

      // Calculate statistics
      const todoCount = {
        total: todos.length,
        pending: todos.filter(t => t.status === 'pending').length,
        in_progress: todos.filter(t => t.status === 'in_progress').length,
        completed: todos.filter(t => t.status === 'completed').length
      };

      return {
        success: true,
        message: `Todos saved successfully. Total: ${todoCount.total}, Pending: ${todoCount.pending}, In Progress: ${todoCount.in_progress}, Completed: ${todoCount.completed}`,
        todoCount
      };
    } catch (error: any) {
      throw new Error(`Failed to write todos: ${error.message}`);
    }
  }

  public async getTodos(): Promise<Todo[]> {
    if (!fs.existsSync(this.todoFilePath)) {
      return [];
    }

    try {
      return fs.readJsonSync(this.todoFilePath);
    } catch (error) {
      return [];
    }
  }
}