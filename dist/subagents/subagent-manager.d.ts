import { SubagentType, SubagentConfig, SubagentTask, SubagentResult } from './subagent-types';
import { BaseSubagent } from './base-subagent';
import { ToolManager } from '../tools/tool-manager';
import { LLMProvider } from '../llm/llm-provider';
export declare class SubagentManager {
    private subagents;
    private toolManager;
    private llmProvider;
    constructor(toolManager?: ToolManager, llmProvider?: LLMProvider);
    private initializeSubagents;
    private createSubagent;
    executeTask(task: SubagentTask): Promise<SubagentResult>;
    private parseSubagentType;
    getSubagent(type: SubagentType): BaseSubagent | undefined;
    getAllSubagents(): Map<SubagentType, BaseSubagent>;
    getAvailableTypes(): SubagentType[];
    getSubagentInfo(type: SubagentType): SubagentConfig | undefined;
}
//# sourceMappingURL=subagent-manager.d.ts.map