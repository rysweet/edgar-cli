"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterLoop = void 0;
const llm_provider_factory_1 = require("../llm/llm-provider-factory");
const tool_manager_1 = require("../tools/tool-manager");
const hook_manager_1 = require("../hooks/hook-manager");
const output_style_manager_1 = require("../output/output-style-manager");
const config_manager_1 = require("../config/config-manager");
class MasterLoop {
    llmProvider;
    toolManager;
    hookManager;
    outputStyleManager;
    messageHistory = [];
    isRunning = false;
    constructor(llmProvider, toolManager, hookManager, outputStyleManager) {
        this.llmProvider = llmProvider || llm_provider_factory_1.LLMProviderFactory.create();
        this.toolManager = toolManager || new tool_manager_1.ToolManager();
        this.hookManager = hookManager || new hook_manager_1.HookManager(new config_manager_1.ConfigManager());
        this.outputStyleManager = outputStyleManager || new output_style_manager_1.OutputStyleManager();
    }
    async processMessage(userMessage, systemPrompt) {
        // Apply output style to system prompt
        const formatter = this.outputStyleManager.getFormatter();
        const styledSystemPrompt = systemPrompt
            ? formatter.formatSystemPrompt(systemPrompt)
            : formatter.formatSystemPrompt('You are Edgar, an AI coding assistant.');
        // Initialize conversation with system prompt
        this.messageHistory = [
            {
                role: 'system',
                content: styledSystemPrompt
            },
            {
                role: 'user',
                content: userMessage
            }
        ];
        // Run the main loop
        const response = await this.runLoop();
        // Apply any post-processing from output style
        return formatter.applyStyle(response);
    }
    async executeTask(task) {
        const formatter = this.outputStyleManager.getFormatter();
        const systemPrompt = formatter.formatSystemPrompt('You are Edgar, an AI coding assistant. Complete the following task thoroughly.');
        this.messageHistory = [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: task
            }
        ];
        await this.runLoop();
    }
    async executeQuery(query) {
        const formatter = this.outputStyleManager.getFormatter();
        const systemPrompt = formatter.formatSystemPrompt('You are Edgar, an AI coding assistant. Answer the following query.');
        this.messageHistory = [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: query
            }
        ];
        const response = await this.runLoop();
        return formatter.applyStyle(response);
    }
    async runLoop() {
        this.isRunning = true;
        let finalResponse = '';
        while (this.isRunning) {
            try {
                // Convert message history to format expected by LLM provider
                const messages = this.messageHistory.map(msg => {
                    if (msg.role === 'tool' && msg.toolResults) {
                        return {
                            role: 'assistant',
                            content: `Tool results: ${JSON.stringify(msg.toolResults)}`
                        };
                    }
                    return {
                        role: msg.role,
                        content: msg.content
                    };
                });
                // Send messages to LLM
                const response = await this.llmProvider.complete(messages);
                // Parse response for tool calls
                const toolCalls = this.parseToolCalls(response);
                if (toolCalls.length > 0) {
                    // Add assistant response with tool calls to history
                    this.messageHistory.push({
                        role: 'assistant',
                        content: response,
                        toolCalls
                    });
                    // Execute tools
                    const toolResults = await this.executeToolCalls(toolCalls);
                    // Add tool results to history
                    this.messageHistory.push({
                        role: 'tool',
                        content: 'Tool execution results',
                        toolResults
                    });
                }
                else {
                    // No more tool calls, save final response and exit loop
                    finalResponse = response;
                    this.messageHistory.push({
                        role: 'assistant',
                        content: response
                    });
                    this.isRunning = false;
                }
            }
            catch (error) {
                console.error('Error in master loop:', error);
                this.isRunning = false;
                throw error;
            }
        }
        return finalResponse;
    }
    parseToolCalls(response) {
        const toolCalls = [];
        // Parse tool calls from response
        // This is a simplified parser - in production, would use more robust parsing
        const toolCallRegex = /<tool_use>(.*?)<\/tool_use>/gs;
        const matches = response.matchAll(toolCallRegex);
        for (const match of matches) {
            try {
                const toolData = JSON.parse(match[1]);
                toolCalls.push({
                    name: toolData.name,
                    parameters: toolData.parameters
                });
            }
            catch (error) {
                console.error('Failed to parse tool call:', error);
            }
        }
        return toolCalls;
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
    setOutputStyle(styleName) {
        return this.outputStyleManager.setActiveStyle(styleName);
    }
    getOutputStyles() {
        return this.outputStyleManager.listStyles();
    }
}
exports.MasterLoop = MasterLoop;
//# sourceMappingURL=master-loop-v2.js.map