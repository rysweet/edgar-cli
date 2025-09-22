"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KillBashTool = void 0;
const base_tool_1 = require("./base-tool");
const bash_output_tool_1 = require("./bash-output-tool");
class KillBashTool extends base_tool_1.BaseTool {
    name = 'KillBash';
    description = 'Kill a running background bash shell by its ID';
    manager = bash_output_tool_1.BashProcessManager.getInstance();
    getDefinition() {
        return {
            name: this.name,
            description: this.description,
            parameters: {
                type: 'object',
                properties: {
                    shell_id: {
                        type: 'string',
                        description: 'The ID of the background shell to kill'
                    }
                },
                required: ['shell_id']
            }
        };
    }
    async execute(parameters) {
        this.validateParameters(parameters, ['shell_id']);
        const { shell_id } = parameters;
        const process = this.manager.getProcess(shell_id);
        if (!process) {
            return {
                success: false,
                message: `No background shell found with ID: ${shell_id}`
            };
        }
        try {
            this.manager.removeProcess(shell_id);
            return {
                success: true,
                message: `Background shell ${shell_id} terminated`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to kill shell: ${error.message}`
            };
        }
    }
}
exports.KillBashTool = KillBashTool;
//# sourceMappingURL=kill-bash-tool.js.map