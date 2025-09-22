import { BaseTool, ToolDefinition } from './base-tool';
import { SubagentManager } from '../subagents/subagent-manager';
import { SubagentResult } from '../subagents/subagent-types';
export interface TaskToolParameters {
    description: string;
    prompt: string;
    subagent_type: string;
}
export declare class TaskTool extends BaseTool {
    name: string;
    description: string;
    private subagentManager?;
    constructor(subagentManager?: SubagentManager);
    private getSubagentManager;
    getDefinition(): ToolDefinition;
    execute(parameters: TaskToolParameters): Promise<SubagentResult>;
    setSubagentManager(manager: SubagentManager): void;
}
//# sourceMappingURL=task-tool.d.ts.map