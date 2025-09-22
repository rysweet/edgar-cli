"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeStyleREPL = void 0;
const readline = __importStar(require("readline"));
const chalk_1 = __importDefault(require("chalk"));
class ClaudeStyleREPL {
    rl;
    masterLoop;
    outputStyleManager;
    isRunning = false;
    constructor(masterLoop, outputStyleManager) {
        this.masterLoop = masterLoop;
        this.outputStyleManager = outputStyleManager;
        // Create readline interface with minimal prompt
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '', // No visible prompt like Claude Code
            terminal: true
        });
    }
    async start() {
        this.isRunning = true;
        // Clear screen for clean start
        console.clear();
        // Minimal startup - no banners or emojis
        console.log('edgar');
        console.log('');
        // Handle line input
        this.rl.on('line', async (input) => {
            await this.handleInput(input.trim());
        });
        // Handle Ctrl+C gracefully
        this.rl.on('SIGINT', () => {
            this.shutdown();
        });
        // Show cursor and wait for input
        this.showPrompt();
    }
    showPrompt() {
        // Just show cursor, no prefix
        process.stdout.write('> ');
    }
    async handleInput(input) {
        if (!input) {
            this.showPrompt();
            return;
        }
        // Handle special commands
        if (input === 'exit' || input === 'quit') {
            this.shutdown();
            return;
        }
        if (input === '/clear') {
            console.clear();
            await this.masterLoop.clearHistory();
            this.showPrompt();
            return;
        }
        if (input === '/help') {
            this.showMinimalHelp();
            this.showPrompt();
            return;
        }
        // Process message without spinner or "Thinking..." text
        try {
            const response = await this.masterLoop.processMessage(input);
            // Display response directly without prefix
            console.log(response);
            console.log(''); // Single blank line
        }
        catch (error) {
            // Minimal error display
            console.error(chalk_1.default.red(`Error: ${error.message}`));
        }
        // Show prompt for next input
        this.showPrompt();
    }
    showMinimalHelp() {
        console.log(`
Commands:
  /clear    Clear conversation
  /help     Show this help
  exit      Exit edgar
  
File references:
  @file.js  Reference a file
  
Tab completion available for file paths.
`);
    }
    shutdown() {
        this.isRunning = false;
        console.log(''); // Newline before exit
        process.exit(0);
    }
    stop() {
        this.isRunning = false;
        this.rl.close();
    }
}
exports.ClaudeStyleREPL = ClaudeStyleREPL;
//# sourceMappingURL=claude-ui.js.map