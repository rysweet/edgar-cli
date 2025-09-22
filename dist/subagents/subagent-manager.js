"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubagentManager = void 0;
const subagent_types_1 = require("./subagent-types");
const generic_subagent_1 = require("./generic-subagent");
const tool_manager_1 = require("../tools/tool-manager");
const llm_provider_factory_1 = require("../llm/llm-provider-factory");
class SubagentManager {
    subagents = new Map();
    toolManager;
    llmProvider;
    constructor(toolManager, llmProvider) {
        this.toolManager = toolManager || new tool_manager_1.ToolManager();
        this.llmProvider = llmProvider || llm_provider_factory_1.LLMProviderFactory.create();
        this.initializeSubagents();
    }
    initializeSubagents() {
        // Initialize all subagents with their configurations
        subagent_types_1.SUBAGENT_CONFIGS.forEach((config, type) => {
            const subagent = this.createSubagent(config);
            this.subagents.set(type, subagent);
        });
    }
    createSubagent(config) {
        // For now, use GenericSubagent for all types
        // In future, we can create specialized subagent classes
        return new generic_subagent_1.GenericSubagent(config, this.toolManager, this.llmProvider);
    }
    async executeTask(task) {
        const subagentType = this.parseSubagentType(task.subagent_type);
        const subagent = this.subagents.get(subagentType);
        if (!subagent) {
            return {
                success: false,
                message: `Unknown subagent type: ${task.subagent_type}`,
                error: 'Subagent not found'
            };
        }
        console.log(`\n🤖 Launching ${subagent.getName()} subagent...`);
        console.log(`📋 Task: ${task.description}`);
        const result = await subagent.execute(task);
        if (result.success) {
            console.log(`✅ ${subagent.getName()} completed successfully`);
        }
        else {
            console.log(`❌ ${subagent.getName()} failed: ${result.error}`);
        }
        return result;
    }
    parseSubagentType(type) {
        // Handle both string and enum types
        if (typeof type === 'string') {
            // Convert string to SubagentType
            const typeKey = type.toUpperCase().replace(/-/g, '_');
            return subagent_types_1.SubagentType[typeKey] || subagent_types_1.SubagentType.GENERAL_PURPOSE;
        }
        return type;
    }
    getSubagent(type) {
        return this.subagents.get(type);
    }
    getAllSubagents() {
        return new Map(this.subagents);
    }
    getAvailableTypes() {
        return Array.from(this.subagents.keys());
    }
    getSubagentInfo(type) {
        return subagent_types_1.SUBAGENT_CONFIGS.get(type);
    }
}
exports.SubagentManager = SubagentManager;
//# sourceMappingURL=subagent-manager.js.map