"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseSubagent = void 0;
const master_loop_v2_1 = require("../core/master-loop-v2");
class BaseSubagent {
    config;
    toolManager;
    llmProvider;
    constructor(config, toolManager, llmProvider) {
        this.config = config;
        this.toolManager = toolManager;
        this.llmProvider = llmProvider;
    }
    async runTask(prompt) {
        // Create a scoped master loop for this subagent
        const masterLoop = new master_loop_v2_1.MasterLoop(this.llmProvider, this.toolManager);
        // Build the system prompt with subagent specialization
        const systemPrompt = this.buildSystemPrompt();
        // Execute the task
        const result = await masterLoop.processMessage(prompt, systemPrompt);
        return result;
    }
    buildSystemPrompt() {
        let prompt = `You are a specialized ${this.config.name} agent.\n`;
        prompt += `Description: ${this.config.description}\n`;
        if (this.config.philosophy) {
            prompt += `Philosophy: ${this.config.philosophy}\n`;
        }
        if (this.config.specializations) {
            prompt += `Specializations: ${this.config.specializations.join(', ')}\n`;
        }
        if (!this.config.tools.includes('*')) {
            prompt += `Available tools: ${this.config.tools.join(', ')}\n`;
        }
        prompt += '\nFollow your specialization and complete the assigned task thoroughly.';
        return prompt;
    }
    filterToolsForSubagent() {
        if (this.config.tools.includes('*')) {
            return Array.from(this.toolManager.getAllTools().keys());
        }
        return this.config.tools;
    }
    getType() {
        return this.config.type;
    }
    getName() {
        return this.config.name;
    }
    getDescription() {
        return this.config.description;
    }
}
exports.BaseSubagent = BaseSubagent;
//# sourceMappingURL=base-subagent.js.map