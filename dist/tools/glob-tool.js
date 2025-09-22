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
exports.GlobTool = void 0;
const base_tool_1 = require("./base-tool");
const glob_1 = require("glob");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
class GlobTool extends base_tool_1.BaseTool {
    name = 'Glob';
    description = 'Fast file pattern matching tool that works with any codebase size';
    getDefinition() {
        return {
            name: this.name,
            description: this.description,
            parameters: {
                type: 'object',
                properties: {
                    pattern: {
                        type: 'string',
                        description: 'The glob pattern to match files against (e.g., "**/*.js", "src/**/*.ts")'
                    },
                    path: {
                        type: 'string',
                        description: 'The directory to search in (defaults to current working directory)'
                    }
                },
                required: ['pattern']
            }
        };
    }
    async execute(parameters) {
        this.validateParameters(parameters, ['pattern']);
        const { pattern, path: searchPath = process.cwd() } = parameters;
        try {
            // Change to the search directory to make glob patterns relative
            const originalCwd = process.cwd();
            const absoluteSearchPath = path.isAbsolute(searchPath) ? searchPath : path.join(originalCwd, searchPath);
            if (!fs.existsSync(absoluteSearchPath)) {
                throw new Error(`Directory not found: ${absoluteSearchPath}`);
            }
            process.chdir(absoluteSearchPath);
            // Execute glob search
            const files = await (0, glob_1.glob)(pattern, {
                dot: true, // Include dotfiles
                ignore: ['**/node_modules/**', '**/.git/**'], // Ignore common directories
            });
            // Convert to absolute paths and sort by modification time
            const absoluteFiles = files
                .map(file => path.join(absoluteSearchPath, file))
                .sort((a, b) => {
                try {
                    const statA = fs.statSync(a);
                    const statB = fs.statSync(b);
                    return statB.mtime.getTime() - statA.mtime.getTime();
                }
                catch {
                    return 0;
                }
            });
            // Restore original working directory
            process.chdir(originalCwd);
            return {
                files: absoluteFiles,
                count: absoluteFiles.length
            };
        }
        catch (error) {
            throw new Error(`Glob search failed: ${error.message}`);
        }
    }
}
exports.GlobTool = GlobTool;
//# sourceMappingURL=glob-tool.js.map