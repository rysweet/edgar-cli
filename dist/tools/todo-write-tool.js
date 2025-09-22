"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoWriteTool = void 0;
const base_tool_1 = require("./base-tool");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const path_utils_1 = require("../config/path-utils");
class TodoWriteTool extends base_tool_1.BaseTool {
    name = 'TodoWrite';
    description = 'Create and manage a structured task list for tracking progress';
    todoFilePath;
    constructor() {
        super();
        const configDir = (0, path_utils_1.getConfigDir)();
        this.todoFilePath = path.join(configDir.projectPath, 'todos.json');
    }
    getDefinition() {
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
    async execute(parameters) {
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
        }
        catch (error) {
            throw new Error(`Failed to write todos: ${error.message}`);
        }
    }
    async getTodos() {
        if (!fs.existsSync(this.todoFilePath)) {
            return [];
        }
        try {
            return fs.readJsonSync(this.todoFilePath);
        }
        catch (error) {
            return [];
        }
    }
}
exports.TodoWriteTool = TodoWriteTool;
//# sourceMappingURL=todo-write-tool.js.map