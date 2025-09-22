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
exports.EditTool = void 0;
const base_tool_1 = require("./base-tool");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class EditTool extends base_tool_1.BaseTool {
    name = 'Edit';
    description = 'Performs exact string replacements in files. Edit will fail if old_string is not unique unless replace_all is true';
    getDefinition() {
        return {
            name: this.name,
            description: this.description,
            parameters: {
                type: 'object',
                properties: {
                    file_path: {
                        type: 'string',
                        description: 'The absolute path to the file to edit'
                    },
                    old_string: {
                        type: 'string',
                        description: 'The exact string to replace'
                    },
                    new_string: {
                        type: 'string',
                        description: 'The string to replace it with'
                    },
                    replace_all: {
                        type: 'boolean',
                        description: 'Replace all occurrences (default: false)',
                        default: false
                    }
                },
                required: ['file_path', 'old_string', 'new_string']
            }
        };
    }
    async execute(parameters) {
        this.validateParameters(parameters, ['file_path', 'old_string', 'new_string']);
        const { file_path, old_string, new_string, replace_all = false } = parameters;
        // Validate absolute path
        if (!path.isAbsolute(file_path)) {
            throw new Error('File path must be absolute');
        }
        // Check if file exists
        if (!fs.existsSync(file_path)) {
            throw new Error('File not found');
        }
        // Validate that old and new strings are different
        if (old_string === new_string) {
            throw new Error('old_string and new_string cannot be the same');
        }
        try {
            // Read the file
            const content = fs.readFileSync(file_path, 'utf-8');
            // Count occurrences
            const occurrences = this.countOccurrences(content, old_string);
            if (occurrences === 0) {
                throw new Error('String not found in file');
            }
            // Check uniqueness if not replacing all
            if (!replace_all && occurrences > 1) {
                throw new Error(`String appears ${occurrences} times in file. Use replace_all or provide more context`);
            }
            // Find line numbers where replacements will occur
            const lineNumbers = this.findLineNumbers(content, old_string, replace_all);
            // Perform replacement
            let newContent;
            if (replace_all) {
                newContent = this.replaceAll(content, old_string, new_string);
            }
            else {
                // Replace only first occurrence
                const index = content.indexOf(old_string);
                newContent = content.substring(0, index) + new_string + content.substring(index + old_string.length);
            }
            // Get file permissions before writing
            const stats = fs.statSync(file_path);
            const mode = stats.mode;
            // Write the modified content
            fs.writeFileSync(file_path, newContent, 'utf-8');
            // Preserve file permissions
            fs.chmodSync(file_path, mode);
            // Create preview
            const preview = this.createPreview(content, newContent, old_string, new_string);
            return {
                success: true,
                message: `Successfully replaced ${replace_all ? occurrences : 1} occurrence(s) in ${file_path}`,
                replacements: replace_all ? occurrences : 1,
                lineNumbers,
                preview
            };
        }
        catch (error) {
            if (error.message.includes('String not found') ||
                error.message.includes('appears') ||
                error.message.includes('cannot be the same')) {
                throw error;
            }
            throw new Error(`Failed to edit file: ${error.message}`);
        }
    }
    countOccurrences(content, searchString) {
        let count = 0;
        let index = content.indexOf(searchString);
        while (index !== -1) {
            count++;
            index = content.indexOf(searchString, index + searchString.length);
        }
        return count;
    }
    replaceAll(content, oldString, newString) {
        // Use split/join for exact string replacement (not regex)
        return content.split(oldString).join(newString);
    }
    findLineNumbers(content, searchString, findAll) {
        const lines = content.split('\n');
        const lineNumbers = [];
        let currentPos = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineStart = currentPos;
            const lineEnd = currentPos + line.length;
            // Check if the search string appears in this line's range
            let searchPos = content.indexOf(searchString, lineStart);
            while (searchPos !== -1 && searchPos <= lineEnd) {
                if (searchPos >= lineStart && searchPos <= lineEnd) {
                    lineNumbers.push(i + 1); // Line numbers are 1-indexed
                    if (!findAll) {
                        return lineNumbers;
                    }
                }
                searchPos = content.indexOf(searchString, searchPos + searchString.length);
                if (searchPos > lineEnd)
                    break;
            }
            currentPos = lineEnd + 1; // +1 for the newline character
        }
        return lineNumbers;
    }
    createPreview(originalContent, newContent, oldString, newString) {
        // Find the first occurrence in the original content
        const index = originalContent.indexOf(oldString);
        if (index === -1) {
            return { before: '', after: '' };
        }
        // Get context around the change (50 chars before and after)
        const contextLength = 50;
        const beforeStart = Math.max(0, index - contextLength);
        const afterEnd = Math.min(originalContent.length, index + oldString.length + contextLength);
        const beforeContext = originalContent.substring(beforeStart, index);
        const afterContext = originalContent.substring(index + oldString.length, afterEnd);
        return {
            before: `${beforeStart > 0 ? '...' : ''}${beforeContext}${oldString}${afterContext}${afterEnd < originalContent.length ? '...' : ''}`,
            after: `${beforeStart > 0 ? '...' : ''}${beforeContext}${newString}${afterContext}${afterEnd < originalContent.length ? '...' : ''}`
        };
    }
}
exports.EditTool = EditTool;
//# sourceMappingURL=edit-tool.js.map