import { MasterLoop } from '../core/master-loop-v2';
import { OutputStyleManager } from '../output/output-style-manager';
export declare class ClaudeStyleREPL {
    private rl;
    private masterLoop;
    private outputStyleManager;
    private isRunning;
    constructor(masterLoop: MasterLoop, outputStyleManager: OutputStyleManager);
    start(): Promise<void>;
    private showPrompt;
    private handleInput;
    private showMinimalHelp;
    private shutdown;
    stop(): void;
}
//# sourceMappingURL=claude-ui.d.ts.map