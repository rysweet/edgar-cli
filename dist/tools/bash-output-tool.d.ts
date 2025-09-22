import { BaseTool, ToolDefinition } from './base-tool';
import { ChildProcess } from 'child_process';
export declare class BashProcessManager {
    private static instance;
    private processes;
    private outputs;
    static getInstance(): BashProcessManager;
    addProcess(id: string, process: ChildProcess): void;
    getOutput(id: string, clear?: boolean): string[];
    getProcess(id: string): ChildProcess | undefined;
    removeProcess(id: string): void;
    listProcesses(): string[];
}
export declare class BashOutputTool extends BaseTool {
    name: string;
    description: string;
    private manager;
    getDefinition(): ToolDefinition;
    execute(parameters: any): Promise<any>;
}
//# sourceMappingURL=bash-output-tool.d.ts.map