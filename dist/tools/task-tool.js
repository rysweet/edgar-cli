"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskTool = void 0;
const base_tool_1 = require("./base-tool");
const subagent_manager_1 = require("../subagents/subagent-manager");
class TaskTool extends base_tool_1.BaseTool {
    name = 'Task';
    description = 'Launch a specialized subagent to handle complex, multi-step tasks autonomously';
    subagentManager;
    constructor(subagentManager) {
        super();
        // Don't create SubagentManager here to avoid circular dependency
        this.subagentManager = subagentManager;
    }
    getSubagentManager() {
        if (!this.subagentManager) {
            // Lazy initialization to avoid circular dependency
            this.subagentManager = new subagent_manager_1.SubagentManager();
        }
        return this.subagentManager;
    }
    getDefinition() {
        return {
            name: this.name,
            description: this.description,
            parameters: {
                type: 'object',
                properties: {
                    description: {
                        type: 'string',
                        description: 'A short (3-5 word) description of the task'
                    },
                    prompt: {
                        type: 'string',
                        description: 'The detailed task for the agent to perform'
                    },
                    subagent_type: {
                        type: 'string',
                        description: 'The type of specialized agent to use for this task',
                        enum: [
                            'general-purpose',
                            'builder',
                            'architect',
                            'reviewer',
                            'tester',
                            'optimizer',
                            'database',
                            'security',
                            'api-designer',
                            'ci-diagnostic',
                            'cleanup',
                            'patterns',
                            'prompt-writer',
                            'analyzer',
                            'integration',
                            'improvement-workflow',
                            'ambiguity',
                            'preference-reviewer',
                            'pre-commit-diagnostic',
                            'output-style-setup',
                            'statusline-setup'
                        ]
                    }
                },
                required: ['description', 'prompt', 'subagent_type']
            }
        };
    }
    async execute(parameters) {
        this.validateParameters(parameters, ['description', 'prompt', 'subagent_type']);
        const task = {
            description: parameters.description,
            prompt: parameters.prompt,
            subagent_type: parameters.subagent_type
        };
        try {
            const result = await this.getSubagentManager().executeTask(task);
            return result;
        }
        catch (error) {
            return {
                success: false,
                message: `Task execution failed: ${error.message}`,
                error: error.message
            };
        }
    }
    setSubagentManager(manager) {
        this.subagentManager = manager;
    }
}
exports.TaskTool = TaskTool;
//# sourceMappingURL=task-tool.js.map