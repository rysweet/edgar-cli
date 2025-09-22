import { ConfigManager } from '../config/config-manager';
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
    private config;
    private llmClient;
    private toolManager;
    private hookManager;
    private messageHistory;
    private isRunning;
    constructor(_config: ConfigManager);
    executeTask(task: string): Promise<void>;
    executeQuery(query: string): Promise<string>;
    private runLoop;
    private executeToolCalls;
    getMessageHistory(): LoopMessage[];
    clearHistory(): void;
    stop(): void;
}
//# sourceMappingURL=master-loop.d.ts.map