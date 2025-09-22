"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolManager = void 0;
const read_tool_1 = require("./read-tool");
const write_tool_1 = require("./write-tool");
const edit_tool_1 = require("./edit-tool");
const multi_edit_tool_1 = require("./multi-edit-tool");
const notebook_edit_tool_1 = require("./notebook-edit-tool");
const bash_tool_1 = require("./bash-tool");
const bash_output_tool_1 = require("./bash-output-tool");
const kill_bash_tool_1 = require("./kill-bash-tool");
const glob_tool_1 = require("./glob-tool");
const grep_tool_1 = require("./grep-tool");
const todo_write_tool_1 = require("./todo-write-tool");
const web_fetch_tool_1 = require("./web-fetch-tool");
const web_search_tool_1 = require("./web-search-tool");
const task_tool_1 = require("./task-tool");
const exit_plan_mode_tool_1 = require("./exit-plan-mode-tool");
class ToolManager {
    tools = new Map();
    constructor() {
        this.initializeTools();
    }
    initializeTools() {
        // Initialize all core tools
        this.registerTool('Read', new read_tool_1.ReadTool());
        this.registerTool('Write', new write_tool_1.WriteTool());
        this.registerTool('Edit', new edit_tool_1.EditTool());
        this.registerTool('MultiEdit', new multi_edit_tool_1.MultiEditTool());
        this.registerTool('NotebookEdit', new notebook_edit_tool_1.NotebookEditTool());
        this.registerTool('Bash', new bash_tool_1.BashTool());
        this.registerTool('BashOutput', new bash_output_tool_1.BashOutputTool());
        this.registerTool('KillBash', new kill_bash_tool_1.KillBashTool());
        this.registerTool('Glob', new glob_tool_1.GlobTool());
        this.registerTool('Grep', new grep_tool_1.GrepTool());
        this.registerTool('TodoWrite', new todo_write_tool_1.TodoWriteTool());
        this.registerTool('WebFetch', new web_fetch_tool_1.WebFetchTool());
        this.registerTool('WebSearch', new web_search_tool_1.WebSearchTool());
        this.registerTool('Task', new task_tool_1.TaskTool());
        this.registerTool('ExitPlanMode', new exit_plan_mode_tool_1.ExitPlanModeTool());
    }
    async executeTool(name, parameters) {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool not found: ${name}`);
        }
        return tool.execute(parameters);
    }
    registerTool(name, tool) {
        this.tools.set(name, tool);
    }
    hasTool(name) {
        return this.tools.has(name);
    }
    getAllTools() {
        return new Map(this.tools);
    }
}
exports.ToolManager = ToolManager;
//# sourceMappingURL=tool-manager.js.map