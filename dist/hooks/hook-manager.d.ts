import { ConfigManager } from '../config/config-manager';
export type HookType = 'PreToolUse' | 'PostToolUse' | 'UserPromptSubmit' | 'Notification' | 'Stop' | 'SubagentStop' | 'PreCompact' | 'SessionStart' | 'SessionEnd';
export interface Hook {
    type: 'command' | 'script';
    command?: string;
    script?: string;
    matcher?: string;
}
export interface HookConfig {
    hooks: Record<string, Hook[]>;
}
export declare class HookManager {
    private config;
    private hooks;
    constructor(_config: ConfigManager);
    private loadHooks;
    private mergeHooks;
    fireHook(hookType: HookType, context?: any): Promise<void>;
    private matchesContext;
    private executeCommand;
    private executeScript;
    getHooks(hookType: HookType): Hook[];
    clearHooks(): void;
}
//# sourceMappingURL=hook-manager.d.ts.map