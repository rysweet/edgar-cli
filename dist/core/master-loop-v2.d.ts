import { LLMProvider } from '../llm/llm-provider';
import { ToolManager } from '../tools/tool-manager';
import { HookManager } from '../hooks/hook-manager';
import { OutputStyleManager } from '../output/output-style-manager';
export interface ToolCall {
    name: string;
    parameters: any;
}
export interface LoopMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    toolCalls?: ToolCall[];
    toolResults?: any[];
}
export declare class MasterLoop {
    private llmProvider;
    private toolManager;
    private hookManager;
    private outputStyleManager;
    private messageHistory;
    private isRunning;
    constructor(llmProvider?: LLMProvider, toolManager?: ToolManager, hookManager?: HookManager, outputStyleManager?: OutputStyleManager);
    processMessage(userMessage: string, systemPrompt?: string): Promise<string>;
    executeTask(task: string): Promise<void>;
    executeQuery(query: string): Promise<string>;
    private runLoop;
    private parseToolCalls;
    private executeToolCalls;
    getMessageHistory(): LoopMessage[];
    clearHistory(): void;
    stop(): void;
    setOutputStyle(styleName: string): boolean;
    getOutputStyles(): string[];
}
//# sourceMappingURL=master-loop-v2.d.ts.map