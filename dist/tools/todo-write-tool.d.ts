import { BaseTool, ToolDefinition } from './base-tool';
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
export declare class TodoWriteTool extends BaseTool {
    name: string;
    description: string;
    private todoFilePath;
    constructor();
    getDefinition(): ToolDefinition;
    execute(parameters: TodoWriteToolParameters): Promise<TodoWriteToolResult>;
    getTodos(): Promise<Todo[]>;
}
//# sourceMappingURL=todo-write-tool.d.ts.map