import { BaseTool, ToolDefinition } from './base-tool';
export interface BashToolParameters {
    command: string;
    timeout?: number;
    working_directory?: string;
    run_in_background?: boolean;
}
export interface BashToolResult {
    success: boolean;
    output: string;
    error?: string;
    exitCode: number;
    truncated?: boolean;
    background?: boolean;
    message?: string;
    metadata: {
        command: string;
        workingDirectory: string;
        executedAt: string;
        duration?: number;
    };
}
export declare class BashTool extends BaseTool {
    name: string;
    description: string;
    private readonly DEFAULT_TIMEOUT;
    private readonly MAX_TIMEOUT;
    private readonly MAX_OUTPUT;
    private readonly DANGEROUS_PATTERNS;
    private readonly BLOCKED_COMMANDS;
    getDefinition(): ToolDefinition;
    execute(parameters: BashToolParameters): Promise<BashToolResult>;
    private checkCommandSafety;
    private executeInBackground;
}
//# sourceMappingURL=bash-tool.d.ts.map