import { MasterLoop } from '../core/master-loop-v2';
import { OutputStyleManager } from '../output/output-style-manager';
export declare class ClaudeCodeUI {
    private screen;
    private outputBox;
    private inputBox;
    private statusBar;
    private processingIndicator;
    private masterLoop;
    private outputStyleManager;
    private isProcessing;
    private spinnerFrame;
    private spinnerInterval;
    private currentVerb;
    private messageCount;
    private sessionStartTime;
    private currentMode;
    constructor(masterLoop: MasterLoop, outputStyleManager: OutputStyleManager);
    private setupEventHandlers;
    private processMessage;
    private startProcessingAnimation;
    private stopProcessingAnimation;
    private appendOutput;
    private updateStatusBar;
    private getUptime;
    private clearConversation;
    private showHelp;
    private shutdown;
    start(): Promise<void>;
}
//# sourceMappingURL=claude-code-ui.d.ts.map