import { BaseSubagent } from './base-subagent';
import { SubagentTask, SubagentResult } from './subagent-types';
export declare class GenericSubagent extends BaseSubagent {
    execute(task: SubagentTask): Promise<SubagentResult>;
    private buildTaskPrompt;
}
//# sourceMappingURL=generic-subagent.d.ts.map