"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Commander = void 0;
class Commander {
    commands = new Map();
    constructor() {
        this.initializeCommands();
    }
    initializeCommands() {
        // Initialize basic commands
        this.commands.set('help', {
            description: 'Show help information',
            handler: () => {
                console.log('Edgar - A Claude Code-compatible CLI');
                console.log('Usage: edgar [options] [task]');
            }
        });
        this.commands.set('version', {
            description: 'Show version information',
            handler: () => {
                console.log('Edgar v0.1.0');
            }
        });
    }
    execute(command, ...args) {
        const cmd = this.commands.get(command);
        if (cmd) {
            cmd.handler(...args);
        }
        else {
            throw new Error(`Unknown command: ${command}`);
        }
    }
    hasCommand(command) {
        return this.commands.has(command);
    }
}
exports.Commander = Commander;
//# sourceMappingURL=commander.js.map