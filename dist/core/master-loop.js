"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterLoop = void 0;
const client_1 = require("../llm/client");
const tool_manager_1 = require("../tools/tool-manager");
const hook_manager_1 = require("../hooks/hook-manager");
class MasterLoop {
    config;
    llmClient;
    toolManager;
    hookManager;
    messageHistory = [];
    isRunning = false;
    constructor(_config) {
        this.config = _config;
        this.llmClient = new client_1.LLMClient(_config);
        this.toolManager = new tool_manager_1.ToolManager();
        this.hookManager = new hook_manager_1.HookManager(_config);
    }
    async executeTask(task) {
        this.messageHistory.push({
            role: 'user',
            content: task
        });
        await this.runLoop();
    }
    async executeQuery(query) {
        this.messageHistory.push({
            role: 'user',
            content: query
        });
        const response = await this.llmClient.sendMessage(this.messageHistory);
        this.messageHistory.push({
            role: 'assistant',
            content: response.content
        });
        return response.content;
    }
    async runLoop() {
        this.isRunning = true;
        while (this.isRunning) {
            try {
                // Send messages to LLM
                const response = await this.llmClient.sendMessage(this.messageHistory);
                // Add assistant response to history
                this.messageHistory.push({
                    role: 'assistant',
                    content: response.content,
                    toolCalls: response.toolCalls
                });
                // Check for tool calls
                if (response.toolCalls && response.toolCalls.length > 0) {
                    // Execute tools
                    const toolResults = await this.executeToolCalls(response.toolCalls);
                    // Add tool results to history
                    this.messageHistory.push({
                        role: 'tool',
                        content: 'Tool execution results',
                        toolResults
                    });
                }
                else {
                    // No more tool calls, exit loop
                    this.isRunning = false;
                }
            }
            catch (error) {
                console.error('Error in master loop:', error);
                this.isRunning = false;
                throw error;
            }
        }
    }
    async executeToolCalls(toolCalls) {
        const results = [];
        for (const toolCall of toolCalls) {
            try {
                // Fire pre-tool-use hook
                await this.hookManager.fireHook('PreToolUse', {
                    tool: toolCall.name,
                    parameters: toolCall.parameters
                });
                // Execute tool
                const result = await this.toolManager.executeTool(toolCall.name, toolCall.parameters);
                results.push(result);
                // Fire post-tool-use hook
                await this.hookManager.fireHook('PostToolUse', {
                    tool: toolCall.name,
                    parameters: toolCall.parameters,
                    result
                });
            }
            catch (error) {
                console.error(`Error executing tool ${toolCall.name}:`, error);
                results.push({
                    error: `Failed to execute tool ${toolCall.name}: ${error}`
                });
            }
        }
        return results;
    }
    getMessageHistory() {
        return [...this.messageHistory];
    }
    clearHistory() {
        this.messageHistory = [];
    }
    stop() {
        this.isRunning = false;
    }
}
exports.MasterLoop = MasterLoop;
//# sourceMappingURL=master-loop.js.map