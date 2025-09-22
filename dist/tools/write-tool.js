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
exports.WriteTool = void 0;
const base_tool_1 = require("./base-tool");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class WriteTool extends base_tool_1.BaseTool {
    name = 'Write';
    description = 'Writes content to a file, creating it if it does not exist or overwriting if it does';
    // System directories that should not be written to
    PROTECTED_DIRS = ['/etc', '/bin', '/sbin', '/usr/bin', '/usr/sbin', '/boot', '/sys', '/proc'];
    getDefinition() {
        return {
            name: this.name,
            description: this.description,
            parameters: {
                type: 'object',
                properties: {
                    file_path: {
                        type: 'string',
                        description: 'The absolute path to the file to write'
                    },
                    content: {
                        type: 'string',
                        description: 'The content to write to the file'
                    }
                },
                required: ['file_path', 'content']
            }
        };
    }
    async execute(parameters) {
        this.validateParameters(parameters, ['file_path', 'content']);
        const { file_path, content, encoding = 'utf-8' } = parameters;
        // Validate absolute path
        if (!path.isAbsolute(file_path)) {
            throw new Error('File path must be absolute');
        }
        // Check for system directories
        if (this.isProtectedPath(file_path)) {
            throw new Error('Cannot write to system directory');
        }
        // Prepare directory
        const dir = path.dirname(file_path);
        fs.ensureDirSync(dir);
        // Check if file exists and read previous content
        let previousContent;
        let previousMode;
        let isOverwrite = false;
        if (fs.existsSync(file_path)) {
            isOverwrite = true;
            try {
                previousContent = fs.readFileSync(file_path, 'utf-8');
                const stats = fs.statSync(file_path);
                previousMode = stats.mode;
            }
            catch (error) {
                // File exists but cannot be read - will still try to overwrite
            }
        }
        try {
            // Write the file
            if (encoding === 'base64') {
                fs.writeFileSync(file_path, Buffer.from(content, 'base64'));
            }
            else {
                fs.writeFileSync(file_path, content, 'utf-8');
            }
            // Preserve file permissions if overwriting
            if (previousMode !== undefined) {
                fs.chmodSync(file_path, previousMode);
            }
            // Calculate statistics
            const lines = content ? content.split('\n').length : 0;
            const size = Buffer.byteLength(content, encoding);
            // Prepare result message
            let message;
            if (content === '') {
                message = `File ${isOverwrite ? 'overwritten with' : 'created as'} empty file: ${file_path}`;
            }
            else if (isOverwrite) {
                message = `File overwritten: ${file_path}`;
            }
            else {
                message = `File created: ${file_path}`;
            }
            const result = {
                success: true,
                message,
                stats: {
                    size,
                    lines
                },
                metadata: {
                    extension: path.extname(file_path),
                    created: !isOverwrite,
                    overwritten: isOverwrite
                }
            };
            if (previousContent !== undefined) {
                result.previousContent = previousContent;
            }
            return result;
        }
        catch (error) {
            throw new Error(error.message);
        }
    }
    isProtectedPath(filePath) {
        const normalizedPath = path.normalize(filePath);
        return this.PROTECTED_DIRS.some(protectedDir => {
            return normalizedPath.startsWith(protectedDir + path.sep) ||
                normalizedPath === protectedDir;
        });
    }
}
exports.WriteTool = WriteTool;
//# sourceMappingURL=write-tool.js.map