"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTool = void 0;
class BaseTool {
    validateParameters(parameters, required = []) {
        for (const param of required) {
            if (!(param in parameters)) {
                throw new Error(`Missing required parameter: ${param}`);
            }
        }
    }
}
exports.BaseTool = BaseTool;
//# sourceMappingURL=base-tool.js.map