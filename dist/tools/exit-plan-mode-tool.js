"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExitPlanModeTool = void 0;
const base_tool_1 = require("./base-tool");
class ExitPlanModeTool extends base_tool_1.BaseTool {
    name = 'ExitPlanMode';
    description = 'Exit plan mode and proceed with implementation';
    getDefinition() {
        return {
            name: this.name,
            description: this.description,
            parameters: {
                type: 'object',
                properties: {
                    plan: {
                        type: 'string',
                        description: 'The plan to execute after exiting plan mode'
                    }
                },
                required: ['plan']
            }
        };
    }
    async execute(parameters) {
        this.validateParameters(parameters, ['plan']);
        const { plan } = parameters;
        // In a real implementation, this would signal the master loop
        // to exit plan mode and start executing the plan
        console.log('\n📋 Exiting plan mode with the following plan:');
        console.log('-------------------------------------------');
        console.log(plan);
        console.log('-------------------------------------------\n');
        return {
            success: true,
            message: 'Exited plan mode',
            plan: plan,
            mode: 'execution'
        };
    }
}
exports.ExitPlanModeTool = ExitPlanModeTool;
//# sourceMappingURL=exit-plan-mode-tool.js.map