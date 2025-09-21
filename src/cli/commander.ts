export class Commander {
  private commands: Map<string, any> = new Map();

  constructor() {
    this.initializeCommands();
  }

  private initializeCommands(): void {
    // Initialize basic commands
    this.commands.set('help', {
      description: 'Show help information',
      handler: () => {
        console.log('Edgar - A Claude Code-compatible CLI');
        console.log('Usage: edgar [options] [task]');
      }
    });

    this.commands.set('version', {
      description: 'Show version information',
      handler: () => {
        console.log('Edgar v0.1.0');
      }
    });
  }

  public execute(command: string, ...args: any[]): void {
    const cmd = this.commands.get(command);
    if (cmd) {
      cmd.handler(...args);
    } else {
      throw new Error(`Unknown command: ${command}`);
    }
  }

  public hasCommand(command: string): boolean {
    return this.commands.has(command);
  }
}