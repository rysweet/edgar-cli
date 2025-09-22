"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdgarCLI = void 0;
const config_manager_1 = require("../config/config-manager");
// import { Commander } from './commander';
const interactive_1 = require("./interactive");
const session_manager_1 = require("../core/session-manager");
const master_loop_1 = require("../core/master-loop");
class EdgarCLI {
    config;
    // private commander: Commander;
    interactiveMode;
    sessionManager;
    masterLoop;
    interactiveCommands;
    constructor() {
        this.config = new config_manager_1.ConfigManager();
        // this.commander = new Commander();
        this.sessionManager = new session_manager_1.SessionManager();
        this.masterLoop = new master_loop_1.MasterLoop(this.config);
        this.interactiveMode = new interactive_1.InteractiveMode(this.masterLoop, this.sessionManager);
        this.interactiveCommands = new Map();
        this.initializeInteractiveCommands();
    }
    initializeInteractiveCommands() {
        this.interactiveCommands.set('/clear', {
            name: 'clear',
            description: 'Clear conversation history',
            handler: async () => {
                await this.sessionManager.clearCurrentSession();
                console.log('Conversation history cleared.');
            }
        });
        this.interactiveCommands.set('/help', {
            name: 'help',
            description: 'Show available commands',
            handler: async () => {
                console.log('Available commands:');
                for (const [key, command] of this.interactiveCommands) {
                    console.log(`  ${key} - ${command.description}`);
                }
            }
        });
        this.interactiveCommands.set('/settings', {
            name: 'settings',
            description: 'Configure settings',
            handler: async () => {
                console.log('Current settings:', this.config.getAll());
            }
        });
        this.interactiveCommands.set('/exit', {
            name: 'exit',
            description: 'Exit Edgar',
            handler: async () => {
                console.log('Goodbye!');
                process.exit(0);
            }
        });
    }
    async run(args) {
        try {
            const parsedArgs = await this.parseArgs(args);
            switch (parsedArgs.mode) {
                case 'interactive':
                    await this.interactiveMode.start();
                    break;
                case 'task':
                    if (parsedArgs.task) {
                        await this.masterLoop.executeTask(parsedArgs.task);
                    }
                    break;
                case 'query':
                    if (parsedArgs.query) {
                        const response = await this.masterLoop.executeQuery(parsedArgs.query);
                        console.log(response);
                    }
                    break;
                case 'continue':
                    await this.sessionManager.continueSession();
                    await this.interactiveMode.start();
                    break;
                case 'resume':
                    await this.sessionManager.resumeSession();
                    await this.interactiveMode.start();
                    break;
                case 'commit':
                    await this.handleCommit();
                    break;
            }
        }
        catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
    async parseArgs(args) {
        // Check for invalid flags
        for (const arg of args) {
            if (arg.startsWith('--') && !this.isValidFlag(arg)) {
                throw new Error(`Invalid flag: ${arg}`);
            }
        }
        // No arguments - interactive mode
        if (args.length === 0) {
            return { mode: 'interactive' };
        }
        // Check for special flags
        if (args.includes('-p')) {
            const queryIndex = args.indexOf('-p') + 1;
            if (queryIndex < args.length) {
                return {
                    mode: 'query',
                    query: args[queryIndex]
                };
            }
            throw new Error('Query flag -p requires a query string');
        }
        if (args.includes('-c')) {
            return { mode: 'continue' };
        }
        if (args.includes('-r')) {
            return { mode: 'resume' };
        }
        // Check for commit command
        if (args[0] === 'commit') {
            return { mode: 'commit' };
        }
        // Default to task mode
        return {
            mode: 'task',
            task: args.join(' ')
        };
    }
    getInteractiveCommand(commandString) {
        return this.interactiveCommands.get(commandString);
    }
    checkNodeVersion() {
        const nodeVersion = process.versions.node;
        const majorVersion = parseInt(nodeVersion.split('.')[0], 10);
        return majorVersion >= 18;
    }
    isValidFlag(flag) {
        const validFlags = ['-p', '-c', '-r', '--help', '--version'];
        return validFlags.includes(flag);
    }
    async handleCommit() {
        console.log('Creating git commit...');
        // TODO: Implement git commit functionality
    }
}
exports.EdgarCLI = EdgarCLI;
//# sourceMappingURL=index.js.map