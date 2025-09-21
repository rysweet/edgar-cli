import { BaseTool } from './base-tool';
import { ReadTool } from './read-tool';
import { WriteTool } from './write-tool';
import { EditTool } from './edit-tool';
import { BashTool } from './bash-tool';
import { GlobTool } from './glob-tool';
import { GrepTool } from './grep-tool';
import { TodoWriteTool } from './todo-write-tool';
import { WebFetchTool } from './web-fetch-tool';
import { WebSearchTool } from './web-search-tool';
import { TaskTool } from './task-tool';

export class ToolManager {
  private tools: Map<string, BaseTool> = new Map();

  constructor() {
    this.initializeTools();
  }

  private initializeTools(): void {
    // Initialize all core tools
    this.registerTool('Read', new ReadTool());
    this.registerTool('Write', new WriteTool());
    this.registerTool('Edit', new EditTool());
    this.registerTool('Bash', new BashTool());
    this.registerTool('Glob', new GlobTool());
    this.registerTool('Grep', new GrepTool());
    this.registerTool('TodoWrite', new TodoWriteTool());
    this.registerTool('WebFetch', new WebFetchTool());
    this.registerTool('WebSearch', new WebSearchTool());
    this.registerTool('Task', new TaskTool());
  }

  public async executeTool(name: string, parameters: any): Promise<any> {
    const tool = this.tools.get(name);
    
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    return tool.execute(parameters);
  }

  public registerTool(name: string, tool: BaseTool): void {
    this.tools.set(name, tool);
  }

  public hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  public getAllTools(): Map<string, BaseTool> {
    return new Map(this.tools);
  }
}