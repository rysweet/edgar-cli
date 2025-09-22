import { BaseTool, ToolDefinition } from './base-tool';
import { spawn, ChildProcess } from 'child_process';

// Store for background bash processes
export class BashProcessManager {
  private static instance: BashProcessManager;
  private processes: Map<string, ChildProcess> = new Map();
  private outputs: Map<string, string[]> = new Map();
  
  static getInstance(): BashProcessManager {
    if (!BashProcessManager.instance) {
      BashProcessManager.instance = new BashProcessManager();
    }
    return BashProcessManager.instance;
  }
  
  addProcess(id: string, process: ChildProcess): void {
    this.processes.set(id, process);
    this.outputs.set(id, []);
    
    // Capture output
    process.stdout?.on('data', (data) => {
      const output = this.outputs.get(id) || [];
      output.push(data.toString());
      this.outputs.set(id, output);
    });
    
    process.stderr?.on('data', (data) => {
      const output = this.outputs.get(id) || [];
      output.push(`[stderr] ${data.toString()}`);
      this.outputs.set(id, output);
    });
    
    process.on('exit', () => {
      const output = this.outputs.get(id) || [];
      output.push('[Process exited]');
      this.outputs.set(id, output);
    });
  }
  
  getOutput(id: string, clear: boolean = true): string[] {
    const output = this.outputs.get(id) || [];
    if (clear) {
      this.outputs.set(id, []);
    }
    return output;
  }
  
  getProcess(id: string): ChildProcess | undefined {
    return this.processes.get(id);
  }
  
  removeProcess(id: string): void {
    const process = this.processes.get(id);
    if (process) {
      process.kill();
      this.processes.delete(id);
      this.outputs.delete(id);
    }
  }
  
  listProcesses(): string[] {
    return Array.from(this.processes.keys());
  }
}

export class BashOutputTool extends BaseTool {
  public name = 'BashOutput';
  public description = 'Retrieve output from a running or completed background bash shell';
  private manager = BashProcessManager.getInstance();

  public getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          bash_id: {
            type: 'string',
            description: 'The ID of the background shell to retrieve output from'
          },
          filter: {
            type: 'string',
            description: 'Optional regular expression to filter output lines'
          }
        },
        required: ['bash_id']
      }
    };
  }

  public async execute(parameters: any): Promise<any> {
    this.validateParameters(parameters, ['bash_id']);
    
    const { bash_id, filter } = parameters;
    const output = this.manager.getOutput(bash_id);
    
    if (output.length === 0) {
      return {
        success: true,
        output: '',
        message: 'No new output'
      };
    }
    
    let filteredOutput = output;
    if (filter) {
      try {
        const regex = new RegExp(filter);
        filteredOutput = output.filter(line => regex.test(line));
      } catch (error) {
        return {
          success: false,
          error: `Invalid regex filter: ${filter}`
        };
      }
    }
    
    return {
      success: true,
      output: filteredOutput.join(''),
      lines: filteredOutput.length
    };
  }
}