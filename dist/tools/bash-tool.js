"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BashTool = void 0;
const base_tool_1 = require("./base-tool");
const child_process_1 = require("child_process");
const bash_output_tool_1 = require("./bash-output-tool");
class BashTool extends base_tool_1.BaseTool {
    name = 'Bash';
    description = 'Executes bash commands in a shell with safety checks and output capture';
    DEFAULT_TIMEOUT = 120000; // 2 minutes
    MAX_TIMEOUT = 600000; // 10 minutes
    MAX_OUTPUT = 30000; // 30k characters
    // Dangerous commands that should be blocked
    DANGEROUS_PATTERNS = [
        /rm\s+-rf\s+\/(?:\s|$|\*)/, // rm -rf / or /*
        /dd\s+.*of=\/dev\/[sh]d/, // dd writing to disk devices
        /mkfs/, // filesystem formatting
        /:\(\)\{.*:\|:&.*\};:/, // fork bomb
        />\s*\/dev\/[sh]d/, // redirecting to disk devices
    ];
    // Commands that should use other tools
    BLOCKED_COMMANDS = {
        find: 'Use the appropriate tool (Glob) for file searching',
        grep: 'Use the appropriate tool (Grep) for content searching',
        rg: 'Use the appropriate tool (Grep) for content searching',
        cat: 'Use the Read tool for reading files',
        head: 'Use the Read tool for reading files',
        tail: 'Use the Read tool for reading files',
        less: 'Use the Read tool for reading files',
        more: 'Use the Read tool for reading files',
    };
    getDefinition() {
        return {
            name: this.name,
            description: this.description,
            parameters: {
                type: 'object',
                properties: {
                    command: {
                        type: 'string',
                        description: 'The bash command to execute'
                    },
                    timeout: {
                        type: 'number',
                        description: 'Command timeout in milliseconds (max 600000ms/10 minutes)'
                    },
                    working_directory: {
                        type: 'string',
                        description: 'Directory to execute the command in'
                    },
                    run_in_background: {
                        type: 'boolean',
                        description: 'Run the command in the background',
                        default: false
                    }
                },
                required: ['command']
            }
        };
    }
    async execute(parameters) {
        this.validateParameters(parameters, ['command']);
        const { command, timeout = this.DEFAULT_TIMEOUT, working_directory = process.cwd(), run_in_background = false } = parameters;
        // Safety checks
        this.checkCommandSafety(command);
        // Enforce maximum timeout
        const actualTimeout = Math.min(timeout, this.MAX_TIMEOUT);
        const startTime = Date.now();
        // Handle background execution
        if (run_in_background) {
            return this.executeInBackground(command, working_directory);
        }
        try {
            const output = (0, child_process_1.execSync)(command, {
                encoding: 'utf-8',
                timeout: actualTimeout,
                maxBuffer: this.MAX_OUTPUT,
                cwd: working_directory,
                shell: '/bin/bash'
            });
            const duration = Date.now() - startTime;
            let finalOutput = output.toString();
            let truncated = false;
            // Truncate if too long
            if (finalOutput.length > this.MAX_OUTPUT) {
                finalOutput = finalOutput.substring(0, this.MAX_OUTPUT) + '\n[Output truncated]';
                truncated = true;
            }
            return {
                success: true,
                output: finalOutput,
                exitCode: 0,
                truncated,
                metadata: {
                    command,
                    workingDirectory: working_directory,
                    executedAt: new Date().toISOString(),
                    duration
                }
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            // Handle timeout specifically
            if (error.code === 'ETIMEDOUT') {
                return {
                    success: false,
                    output: '',
                    error: `Command timed out after ${actualTimeout}ms`,
                    exitCode: -1,
                    metadata: {
                        command,
                        workingDirectory: working_directory,
                        executedAt: new Date().toISOString(),
                        duration
                    }
                };
            }
            // Handle command execution errors
            const exitCode = error.status || -1;
            const errorMessage = error.stderr?.toString() || error.message;
            const output = error.stdout?.toString() || '';
            return {
                success: false,
                output,
                error: errorMessage,
                exitCode,
                metadata: {
                    command,
                    workingDirectory: working_directory,
                    executedAt: new Date().toISOString(),
                    duration
                }
            };
        }
    }
    checkCommandSafety(command) {
        // Check for dangerous commands
        for (const pattern of this.DANGEROUS_PATTERNS) {
            if (pattern.test(command)) {
                throw new Error('Command blocked for safety reasons');
            }
        }
        // Check for blocked commands
        const firstWord = command.split(/\s+/)[0];
        if (this.BLOCKED_COMMANDS[firstWord]) {
            throw new Error(this.BLOCKED_COMMANDS[firstWord]);
        }
        // Additional check for full command patterns
        if (command.match(/\b(find|grep|cat|head|tail|less|more)\b/)) {
            // Check if it's actually one of these commands (not part of another word)
            const cmdParts = command.split(/[;&|]/)[0].trim().split(/\s+/);
            const cmd = cmdParts[0];
            if (this.BLOCKED_COMMANDS[cmd]) {
                throw new Error(this.BLOCKED_COMMANDS[cmd]);
            }
        }
    }
    executeInBackground(command, workingDirectory) {
        // Generate unique ID for this background process
        const bashId = `bash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const child = (0, child_process_1.spawn)(command, [], {
            shell: '/bin/bash',
            cwd: workingDirectory,
            detached: false, // Keep attached so we can capture output
            stdio: ['ignore', 'pipe', 'pipe']
        });
        // Register with BashProcessManager
        const manager = bash_output_tool_1.BashProcessManager.getInstance();
        manager.addProcess(bashId, child);
        return Promise.resolve({
            success: true,
            output: `Started in background with ID: ${bashId}`,
            exitCode: 0,
            background: true,
            message: `Command started in background. Use BashOutput tool with bash_id="${bashId}" to retrieve output`,
            metadata: {
                command,
                workingDirectory,
                executedAt: new Date().toISOString()
            }
        });
    }
}
exports.BashTool = BashTool;
//# sourceMappingURL=bash-tool.js.map