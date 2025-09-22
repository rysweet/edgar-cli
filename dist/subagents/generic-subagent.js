"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericSubagent = void 0;
const base_subagent_1 = require("./base-subagent");
class GenericSubagent extends base_subagent_1.BaseSubagent {
    async execute(task) {
        try {
            // Build the full prompt with task context
            const fullPrompt = this.buildTaskPrompt(task);
            // Execute the task using the master loop
            const result = await this.runTask(fullPrompt);
            return {
                success: true,
                message: `Task completed by ${this.getName()}`,
                output: result
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Task failed: ${error.message}`,
                error: error.message
            };
        }
    }
    buildTaskPrompt(task) {
        let prompt = `# Task Description\n${task.description}\n\n`;
        prompt += `# Task Instructions\n${task.prompt}\n\n`;
        prompt += `# Important Notes\n`;
        prompt += `- You are operating as a ${this.getName()} subagent\n`;
        prompt += `- Focus on your specialized area of expertise\n`;
        prompt += `- Complete the task thoroughly and return clear results\n`;
        if (this.config.tools && !this.config.tools.includes('*')) {
            prompt += `- You have access to these tools: ${this.config.tools.join(', ')}\n`;
        }
        return prompt;
    }
}
exports.GenericSubagent = GenericSubagent;
//# sourceMappingURL=generic-subagent.js.map