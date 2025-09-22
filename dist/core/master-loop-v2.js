"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterLoop = void 0;
const llm_provider_factory_1 = require("../llm/llm-provider-factory");
const tool_manager_1 = require("../tools/tool-manager");
const hook_manager_1 = require("../hooks/hook-manager");
const output_style_manager_1 = require("../output/output-style-manager");
const config_manager_1 = require("../config/config-manager");
const conversation_manager_1 = require("../memory/conversation-manager");
class MasterLoop {
    llmProvider;
    toolManager;
    hookManager;
    outputStyleManager;
    conversationManager;
    messageHistory = [];
    isRunning = false;
    isConversationStarted = false;
    constructor(llmProvider, toolManager, hookManager, outputStyleManager, conversationManager) {
        this.llmProvider = llmProvider || llm_provider_factory_1.LLMProviderFactory.create();
        this.toolManager = toolManager || new tool_manager_1.ToolManager();
        this.hookManager = hookManager || new hook_manager_1.HookManager(new config_manager_1.ConfigManager());
        this.outputStyleManager = outputStyleManager || new output_style_manager_1.OutputStyleManager();
        this.conversationManager = conversationManager || new conversation_manager_1.ConversationManager();
        // If conversation manager already has history, we're continuing a session
        const existingHistory = this.conversationManager.getConversationHistory();
        if (existingHistory && existingHistory.length > 0) {
            this.messageHistory = existingHistory;
            this.isConversationStarted = true;
        }
    }
    async processMessage(userMessage, systemPrompt) {
        // Apply output style to system prompt
        const formatter = this.outputStyleManager.getFormatter();
        const styledSystemPrompt = systemPrompt
            ? formatter.formatSystemPrompt(systemPrompt)
            : formatter.formatSystemPrompt('You are Edgar, an AI coding assistant.');
        // Initialize conversation on first message only
        if (!this.isConversationStarted) {
            // Check if session already exists (from initialization)
            const currentSession = this.conversationManager.getCurrentSession();
            if (!currentSession) {
                // Only start new session if one doesn't exist
                await this.conversationManager.startSession();
            }
            // Add system prompt if conversation is empty
            const history = this.conversationManager.getConversationHistory();
            if (history.length === 0) {
                await this.conversationManager.addSystemMessage(styledSystemPrompt);
            }
            // Load message history from conversation manager
            this.messageHistory = this.conversationManager.getConversationHistory();
            this.isConversationStarted = true;
        }
        // Add user message to conversation manager
        await this.conversationManager.addUserMessage(userMessage);
        // Update local message history
        this.messageHistory = this.conversationManager.getConversationHistory();
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
                    // Add assistant response with tool calls to conversation manager
                    await this.conversationManager.addAssistantMessage(response, toolCalls);
                    // Update local message history
                    this.messageHistory = this.conversationManager.getConversationHistory();
                    // Execute tools
                    const toolResults = await this.executeToolCalls(toolCalls);
                    // Add tool results to history (for now, as system message)
                    await this.conversationManager.addSystemMessage(`Tool execution results: ${JSON.stringify(toolResults)}`);
                    // Update local message history
                    this.messageHistory = this.conversationManager.getConversationHistory();
                }
                else {
                    // No more tool calls, save final response and exit loop
                    finalResponse = response;
                    // Save assistant response to conversation manager
                    await this.conversationManager.addAssistantMessage(response);
                    // Update local message history
                    this.messageHistory = this.conversationManager.getConversationHistory();
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
    async clearHistory() {
        await this.conversationManager.clearConversation();
        this.messageHistory = [];
        this.isConversationStarted = false;
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