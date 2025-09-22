"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BashOutputTool = exports.BashProcessManager = void 0;
const base_tool_1 = require("./base-tool");
// Store for background bash processes
class BashProcessManager {
    static instance;
    processes = new Map();
    outputs = new Map();
    static getInstance() {
        if (!BashProcessManager.instance) {
            BashProcessManager.instance = new BashProcessManager();
        }
        return BashProcessManager.instance;
    }
    addProcess(id, process) {
        this.processes.set(id, process);
        this.outputs.set(id, []);
        // Capture output
        process.stdout?.on('data', (data) => {
            const output = this.outputs.get(id) || [];
            output.push(data.toString());
            this.outputs.set(id, output);
        });
        process.stderr?.on('data', (data) => {
            const output = this.outputs.get(id) || [];
            output.push(`[stderr] ${data.toString()}`);
            this.outputs.set(id, output);
        });
        process.on('exit', () => {
            const output = this.outputs.get(id) || [];
            output.push('[Process exited]');
            this.outputs.set(id, output);
        });
    }
    getOutput(id, clear = true) {
        const output = this.outputs.get(id) || [];
        if (clear) {
            this.outputs.set(id, []);
        }
        return output;
    }
    getProcess(id) {
        return this.processes.get(id);
    }
    removeProcess(id) {
        const process = this.processes.get(id);
        if (process) {
            process.kill();
            this.processes.delete(id);
            this.outputs.delete(id);
        }
    }
    listProcesses() {
        return Array.from(this.processes.keys());
    }
}
exports.BashProcessManager = BashProcessManager;
class BashOutputTool extends base_tool_1.BaseTool {
    name = 'BashOutput';
    description = 'Retrieve output from a running or completed background bash shell';
    manager = BashProcessManager.getInstance();
    getDefinition() {
        return {
            name: this.name,
            description: this.description,
            parameters: {
                type: 'object',
                properties: {
                    bash_id: {
                        type: 'string',
                        description: 'The ID of the background shell to retrieve output from'
                    },
                    filter: {
                        type: 'string',
                        description: 'Optional regular expression to filter output lines'
                    }
                },
                required: ['bash_id']
            }
        };
    }
    async execute(parameters) {
        this.validateParameters(parameters, ['bash_id']);
        const { bash_id, filter } = parameters;
        const output = this.manager.getOutput(bash_id);
        if (output.length === 0) {
            return {
                success: true,
                output: '',
                message: 'No new output'
            };
        }
        let filteredOutput = output;
        if (filter) {
            try {
                const regex = new RegExp(filter);
                filteredOutput = output.filter(line => regex.test(line));
            }
            catch (error) {
                return {
                    success: false,
                    error: `Invalid regex filter: ${filter}`
                };
            }
        }
        return {
            success: true,
            output: filteredOutput.join(''),
            lines: filteredOutput.length
        };
    }
}
exports.BashOutputTool = BashOutputTool;
//# sourceMappingURL=bash-output-tool.js.map