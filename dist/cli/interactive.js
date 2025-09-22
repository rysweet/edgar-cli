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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractiveMode = void 0;
const readline = __importStar(require("readline"));
class InteractiveMode {
    rl;
    masterLoop;
    sessionManager;
    isRunning = false;
    constructor(masterLoop, sessionManager) {
        this.masterLoop = masterLoop;
        this.sessionManager = sessionManager;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'edgar> '
        });
    }
    async start() {
        this.isRunning = true;
        console.log('Welcome to Edgar! Type /help for available commands.');
        this.rl.prompt();
        this.rl.on('line', async (line) => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('/')) {
                await this.handleCommand(trimmedLine);
            }
            else if (trimmedLine.toLowerCase() === 'exit') {
                this.stop();
            }
            else if (trimmedLine) {
                await this.handleUserInput(trimmedLine);
            }
            if (this.isRunning) {
                this.rl.prompt();
            }
        });
        this.rl.on('close', () => {
            console.log('Goodbye!');
            process.exit(0);
        });
        // Keep the process running
        return new Promise(() => { });
    }
    async handleCommand(command) {
        switch (command) {
            case '/clear':
                await this.sessionManager.clearCurrentSession();
                console.log('Conversation history cleared.');
                break;
            case '/help':
                this.showHelp();
                break;
            case '/settings':
                console.log('Settings command - not yet implemented');
                break;
            case '/exit':
                this.stop();
                break;
            default:
                console.log(`Unknown command: ${command}`);
        }
    }
    async handleUserInput(input) {
        try {
            console.log('Processing your request...');
            await this.masterLoop.executeTask(input);
        }
        catch (error) {
            console.error('Error processing request:', error);
        }
    }
    showHelp() {
        console.log('Available commands:');
        console.log('  /clear    - Clear conversation history');
        console.log('  /help     - Show this help message');
        console.log('  /settings - Configure settings');
        console.log('  /exit     - Exit Edgar');
        console.log('  exit      - Exit Edgar');
    }
    stop() {
        this.isRunning = false;
        this.rl.close();
    }
}
exports.InteractiveMode = InteractiveMode;
//# sourceMappingURL=interactive.js.map