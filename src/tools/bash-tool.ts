import { BaseTool, ToolDefinition } from './base-tool';
import { execSync, spawn } from 'child_process';
import * as path from 'path';
import { BashProcessManager } from './bash-output-tool';

export interface BashToolParameters {
  command: string;
  timeout?: number;
  working_directory?: string;
  run_in_background?: boolean;
}

export interface BashToolResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  truncated?: boolean;
  background?: boolean;
  message?: string;
  metadata: {
    command: string;
    workingDirectory: string;
    executedAt: string;
    duration?: number;
  };
}

export class BashTool extends BaseTool {
  public name = 'Bash';
  public description = 'Executes bash commands in a shell with safety checks and output capture';

  private readonly DEFAULT_TIMEOUT = 120000; // 2 minutes
  private readonly MAX_TIMEOUT = 600000; // 10 minutes
  private readonly MAX_OUTPUT = 30000; // 30k characters

  // Dangerous commands that should be blocked
  private readonly DANGEROUS_PATTERNS = [
    /rm\s+-rf\s+\/(?:\s|$|\*)/,  // rm -rf / or /*
    /dd\s+.*of=\/dev\/[sh]d/,      // dd writing to disk devices
    /mkfs/,                         // filesystem formatting
    /:\(\)\{.*:\|:&.*\};:/,        // fork bomb
    />\s*\/dev\/[sh]d/,            // redirecting to disk devices
  ];

  // Commands that should use other tools
  private readonly BLOCKED_COMMANDS = {
    find: 'Use the appropriate tool (Glob) for file searching',
    grep: 'Use the appropriate tool (Grep) for content searching',
    rg: 'Use the appropriate tool (Grep) for content searching',
    cat: 'Use the Read tool for reading files',
    head: 'Use the Read tool for reading files',
    tail: 'Use the Read tool for reading files',
    less: 'Use the Read tool for reading files',
    more: 'Use the Read tool for reading files',
  };

  public getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The bash command to execute'
          },
          timeout: {
            type: 'number',
            description: 'Command timeout in milliseconds (max 600000ms/10 minutes)'
          },
          working_directory: {
            type: 'string',
            description: 'Directory to execute the command in'
          },
          run_in_background: {
            type: 'boolean',
            description: 'Run the command in the background',
            default: false
          }
        },
        required: ['command']
      }
    };
  }

  public async execute(parameters: BashToolParameters): Promise<BashToolResult> {
    this.validateParameters(parameters, ['command']);

    const { 
      command, 
      timeout = this.DEFAULT_TIMEOUT,
      working_directory = process.cwd(),
      run_in_background = false
    } = parameters;

    // Safety checks
    this.checkCommandSafety(command);

    // Enforce maximum timeout
    const actualTimeout = Math.min(timeout, this.MAX_TIMEOUT);

    const startTime = Date.now();

    // Handle background execution
    if (run_in_background) {
      return this.executeInBackground(command, working_directory);
    }

    try {
      const output = execSync(command, {
        encoding: 'utf-8',
        timeout: actualTimeout,
        maxBuffer: this.MAX_OUTPUT,
        cwd: working_directory,
        shell: '/bin/bash'
      });

      const duration = Date.now() - startTime;
      let finalOutput = output.toString();
      let truncated = false;

      // Truncate if too long
      if (finalOutput.length > this.MAX_OUTPUT) {
        finalOutput = finalOutput.substring(0, this.MAX_OUTPUT) + '\n[Output truncated]';
        truncated = true;
      }

      return {
        success: true,
        output: finalOutput,
        exitCode: 0,
        truncated,
        metadata: {
          command,
          workingDirectory: working_directory,
          executedAt: new Date().toISOString(),
          duration
        }
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Handle timeout specifically
      if (error.code === 'ETIMEDOUT') {
        return {
          success: false,
          output: '',
          error: `Command timed out after ${actualTimeout}ms`,
          exitCode: -1,
          metadata: {
            command,
            workingDirectory: working_directory,
            executedAt: new Date().toISOString(),
            duration
          }
        };
      }

      // Handle command execution errors
      const exitCode = error.status || -1;
      const errorMessage = error.stderr?.toString() || error.message;
      const output = error.stdout?.toString() || '';

      return {
        success: false,
        output,
        error: errorMessage,
        exitCode,
        metadata: {
          command,
          workingDirectory: working_directory,
          executedAt: new Date().toISOString(),
          duration
        }
      };
    }
  }

  private checkCommandSafety(command: string): void {
    // Check for dangerous commands
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        throw new Error('Command blocked for safety reasons');
      }
    }

    // Check for blocked commands
    const firstWord = command.split(/\s+/)[0];
    if (this.BLOCKED_COMMANDS[firstWord as keyof typeof this.BLOCKED_COMMANDS]) {
      throw new Error(this.BLOCKED_COMMANDS[firstWord as keyof typeof this.BLOCKED_COMMANDS]);
    }

    // Additional check for full command patterns
    if (command.match(/\b(find|grep|cat|head|tail|less|more)\b/)) {
      // Check if it's actually one of these commands (not part of another word)
      const cmdParts = command.split(/[;&|]/)[0].trim().split(/\s+/);
      const cmd = cmdParts[0];
      
      if (this.BLOCKED_COMMANDS[cmd as keyof typeof this.BLOCKED_COMMANDS]) {
        throw new Error(this.BLOCKED_COMMANDS[cmd as keyof typeof this.BLOCKED_COMMANDS]);
      }
    }
  }

  private executeInBackground(command: string, workingDirectory: string): Promise<BashToolResult> {
    // Generate unique ID for this background process
    const bashId = `bash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const child = spawn(command, [], {
      shell: '/bin/bash',
      cwd: workingDirectory,
      detached: false, // Keep attached so we can capture output
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Register with BashProcessManager
    const manager = BashProcessManager.getInstance();
    manager.addProcess(bashId, child);

    return Promise.resolve({
      success: true,
      output: `Started in background with ID: ${bashId}`,
      exitCode: 0,
      background: true,
      message: `Command started in background. Use BashOutput tool with bash_id="${bashId}" to retrieve output`,
      metadata: {
        command,
        workingDirectory,
        executedAt: new Date().toISOString()
      }
    });
  }
}