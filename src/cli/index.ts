import { ConfigManager } from '../config/config-manager';
// import { Commander } from './commander';
import { InteractiveMode } from './interactive';
import { SessionManager } from '../core/session-manager';
import { MasterLoop } from '../core/master-loop';

export interface ParsedArgs {
  mode: 'interactive' | 'task' | 'query' | 'continue' | 'resume' | 'commit';
  task?: string;
  query?: string;
  options?: Record<string, any>;
}

export interface InteractiveCommand {
  name: string;
  description: string;
  handler: () => Promise<void>;
}

export class EdgarCLI {
  public config: ConfigManager;
  // private commander: Commander;
  private interactiveMode: InteractiveMode;
  private sessionManager: SessionManager;
  private masterLoop: MasterLoop;
  private interactiveCommands: Map<string, InteractiveCommand>;

  constructor() {
    this.config = new ConfigManager();
    // this.commander = new Commander();
    this.sessionManager = new SessionManager();
    this.masterLoop = new MasterLoop(this.config);
    this.interactiveMode = new InteractiveMode(this.masterLoop, this.sessionManager);
    this.interactiveCommands = new Map();
    this.initializeInteractiveCommands();
  }

  private initializeInteractiveCommands(): void {
    this.interactiveCommands.set('/clear', {
      name: 'clear',
      description: 'Clear conversation history',
      handler: async () => {
        await this.sessionManager.clearCurrentSession();
        console.log('Conversation history cleared.');
      }
    });

    this.interactiveCommands.set('/help', {
      name: 'help',
      description: 'Show available commands',
      handler: async () => {
        console.log('Available commands:');
        for (const [key, command] of this.interactiveCommands) {
          console.log(`  ${key} - ${command.description}`);
        }
      }
    });

    this.interactiveCommands.set('/settings', {
      name: 'settings',
      description: 'Configure settings',
      handler: async () => {
        console.log('Current settings:', this.config.getAll());
      }
    });

    this.interactiveCommands.set('/exit', {
      name: 'exit',
      description: 'Exit Edgar',
      handler: async () => {
        console.log('Goodbye!');
        process.exit(0);
      }
    });
  }

  public async run(args: string[]): Promise<void> {
    try {
      const parsedArgs = await this.parseArgs(args);

      switch (parsedArgs.mode) {
        case 'interactive':
          await this.interactiveMode.start();
          break;
        
        case 'task':
          if (parsedArgs.task) {
            await this.masterLoop.executeTask(parsedArgs.task);
          }
          break;
        
        case 'query':
          if (parsedArgs.query) {
            const response = await this.masterLoop.executeQuery(parsedArgs.query);
            console.log(response);
          }
          break;
        
        case 'continue':
          await this.sessionManager.continueSession();
          await this.interactiveMode.start();
          break;
        
        case 'resume':
          await this.sessionManager.resumeSession();
          await this.interactiveMode.start();
          break;
        
        case 'commit':
          await this.handleCommit();
          break;
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  public async parseArgs(args: string[]): Promise<ParsedArgs> {
    // Check for invalid flags
    for (const arg of args) {
      if (arg.startsWith('--') && !this.isValidFlag(arg)) {
        throw new Error(`Invalid flag: ${arg}`);
      }
    }

    // No arguments - interactive mode
    if (args.length === 0) {
      return { mode: 'interactive' };
    }

    // Check for special flags
    if (args.includes('-p')) {
      const queryIndex = args.indexOf('-p') + 1;
      if (queryIndex < args.length) {
        return { 
          mode: 'query', 
          query: args[queryIndex] 
        };
      }
      throw new Error('Query flag -p requires a query string');
    }

    if (args.includes('-c')) {
      return { mode: 'continue' };
    }

    if (args.includes('-r')) {
      return { mode: 'resume' };
    }

    // Check for commit command
    if (args[0] === 'commit') {
      return { mode: 'commit' };
    }

    // Default to task mode
    return { 
      mode: 'task', 
      task: args.join(' ') 
    };
  }

  public getInteractiveCommand(commandString: string): InteractiveCommand | undefined {
    return this.interactiveCommands.get(commandString);
  }

  public checkNodeVersion(): boolean {
    const nodeVersion = process.versions.node;
    const majorVersion = parseInt(nodeVersion.split('.')[0], 10);
    return majorVersion >= 18;
  }

  private isValidFlag(flag: string): boolean {
    const validFlags = ['-p', '-c', '-r', '--help', '--version'];
    return validFlags.includes(flag);
  }

  private async handleCommit(): Promise<void> {
    console.log('Creating git commit...');
    // TODO: Implement git commit functionality
  }
}