import { ConfigManager } from '../config/config-manager';
export interface ParsedArgs {
    mode: 'interactive' | 'task' | 'query' | 'continue' | 'resume' | 'commit';
    task?: string;
    query?: string;
    options?: Record<string, any>;
}
export interface InteractiveCommand {
    name: string;
    description: string;
    handler: () => Promise<void>;
}
export declare class EdgarCLI {
    config: ConfigManager;
    private interactiveMode;
    private sessionManager;
    private masterLoop;
    private interactiveCommands;
    constructor();
    private initializeInteractiveCommands;
    run(args: string[]): Promise<void>;
    parseArgs(args: string[]): Promise<ParsedArgs>;
    getInteractiveCommand(commandString: string): InteractiveCommand | undefined;
    checkNodeVersion(): boolean;
    private isValidFlag;
    private handleCommit;
}
//# sourceMappingURL=index.d.ts.map