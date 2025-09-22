import { MasterLoop } from '../core/master-loop';
import { SessionManager } from '../core/session-manager';
export declare class InteractiveMode {
    private rl;
    private masterLoop;
    private sessionManager;
    private isRunning;
    constructor(masterLoop: MasterLoop, sessionManager: SessionManager);
    start(): Promise<void>;
    private handleCommand;
    private handleUserInput;
    private showHelp;
    stop(): void;
}
//# sourceMappingURL=interactive.d.ts.map