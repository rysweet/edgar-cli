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
exports.NotebookEditTool = void 0;
const base_tool_1 = require("./base-tool");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class NotebookEditTool extends base_tool_1.BaseTool {
    name = 'NotebookEdit';
    description = 'Edit Jupyter notebook cells';
    getDefinition() {
        return {
            name: this.name,
            description: this.description,
            parameters: {
                type: 'object',
                properties: {
                    notebook_path: {
                        type: 'string',
                        description: 'The absolute path to the Jupyter notebook file'
                    },
                    cell_id: {
                        type: 'string',
                        description: 'The ID of the cell to edit'
                    },
                    cell_type: {
                        type: 'string',
                        enum: ['code', 'markdown'],
                        description: 'The type of the cell'
                    },
                    edit_mode: {
                        type: 'string',
                        enum: ['replace', 'insert', 'delete'],
                        description: 'The type of edit to make'
                    },
                    new_source: {
                        type: 'string',
                        description: 'The new source for the cell'
                    }
                },
                required: ['notebook_path', 'new_source']
            }
        };
    }
    async execute(parameters) {
        this.validateParameters(parameters, ['notebook_path', 'new_source']);
        const { notebook_path, cell_id, cell_type, edit_mode = 'replace', new_source } = parameters;
        const absolutePath = path.resolve(notebook_path);
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Notebook not found: ${absolutePath}`);
        }
        const notebook = fs.readJsonSync(absolutePath);
        if (!notebook.cells) {
            throw new Error('Invalid notebook format: no cells array');
        }
        if (edit_mode === 'insert') {
            const newCell = {
                cell_type: cell_type || 'code',
                metadata: {},
                source: new_source.split('\n').map((line, i, arr) => i === arr.length - 1 ? line : line + '\n')
            };
            if (cell_id) {
                const index = notebook.cells.findIndex((c) => c.id === cell_id);
                if (index >= 0) {
                    notebook.cells.splice(index + 1, 0, newCell);
                }
                else {
                    notebook.cells.unshift(newCell);
                }
            }
            else {
                notebook.cells.push(newCell);
            }
        }
        else if (edit_mode === 'delete') {
            if (cell_id) {
                const index = notebook.cells.findIndex((c) => c.id === cell_id);
                if (index >= 0) {
                    notebook.cells.splice(index, 1);
                }
            }
        }
        else {
            // Replace mode
            if (cell_id) {
                const cell = notebook.cells.find((c) => c.id === cell_id);
                if (cell) {
                    cell.source = new_source.split('\n').map((line, i, arr) => i === arr.length - 1 ? line : line + '\n');
                    if (cell_type) {
                        cell.cell_type = cell_type;
                    }
                }
            }
            else if (notebook.cells.length > 0) {
                // Edit first cell if no ID specified
                notebook.cells[0].source = new_source.split('\n').map((line, i, arr) => i === arr.length - 1 ? line : line + '\n');
                if (cell_type) {
                    notebook.cells[0].cell_type = cell_type;
                }
            }
        }
        fs.writeJsonSync(absolutePath, notebook, { spaces: 2 });
        return {
            success: true,
            message: `Notebook edited: ${absolutePath}`,
            edit_mode: edit_mode
        };
    }
}
exports.NotebookEditTool = NotebookEditTool;
//# sourceMappingURL=notebook-edit-tool.js.map