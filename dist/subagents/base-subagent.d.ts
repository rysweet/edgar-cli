import { SubagentType, SubagentConfig, SubagentTask, SubagentResult } from './subagent-types';
import { ToolManager } from '../tools/tool-manager';
import { LLMProvider } from '../llm/llm-provider';
export declare abstract class BaseSubagent {
    protected config: SubagentConfig;
    protected toolManager: ToolManager;
    protected llmProvider: LLMProvider;
    constructor(config: SubagentConfig, toolManager: ToolManager, llmProvider: LLMProvider);
    abstract execute(task: SubagentTask): Promise<SubagentResult>;
    protected runTask(prompt: string): Promise<any>;
    protected buildSystemPrompt(): string;
    protected filterToolsForSubagent(): string[];
    getType(): SubagentType;
    getName(): string;
    getDescription(): string;
}
//# sourceMappingURL=base-subagent.d.ts.map