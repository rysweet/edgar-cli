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
exports.MultiEditTool = void 0;
const base_tool_1 = require("./base-tool");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class MultiEditTool extends base_tool_1.BaseTool {
    name = 'MultiEdit';
    description = 'Make multiple edits to a single file in one operation';
    getDefinition() {
        return {
            name: this.name,
            description: this.description,
            parameters: {
                type: 'object',
                properties: {
                    file_path: {
                        type: 'string',
                        description: 'The absolute path to the file to modify'
                    },
                    edits: {
                        type: 'array',
                        description: 'Array of edit operations to perform sequentially',
                        items: {
                            type: 'object',
                            properties: {
                                old_string: {
                                    type: 'string',
                                    description: 'The text to replace'
                                },
                                new_string: {
                                    type: 'string',
                                    description: 'The text to replace it with'
                                },
                                replace_all: {
                                    type: 'boolean',
                                    description: 'Replace all occurrences (default false)'
                                }
                            },
                            required: ['old_string', 'new_string']
                        }
                    }
                },
                required: ['file_path', 'edits']
            }
        };
    }
    async execute(parameters) {
        this.validateParameters(parameters, ['file_path', 'edits']);
        const { file_path, edits } = parameters;
        const absolutePath = path.resolve(file_path);
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`File not found: ${absolutePath}`);
        }
        let content = fs.readFileSync(absolutePath, 'utf-8');
        let changesMade = 0;
        for (const edit of edits) {
            const { old_string, new_string, replace_all = false } = edit;
            if (old_string === new_string) {
                continue;
            }
            if (replace_all) {
                const count = (content.match(new RegExp(old_string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
                content = content.split(old_string).join(new_string);
                changesMade += count;
            }
            else {
                if (content.includes(old_string)) {
                    content = content.replace(old_string, new_string);
                    changesMade++;
                }
            }
        }
        fs.writeFileSync(absolutePath, content, 'utf-8');
        return {
            success: true,
            message: `Applied ${changesMade} edits to ${absolutePath}`,
            changes_made: changesMade
        };
    }
}
exports.MultiEditTool = MultiEditTool;
//# sourceMappingURL=multi-edit-tool.js.map