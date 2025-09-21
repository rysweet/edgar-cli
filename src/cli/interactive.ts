import * as readline from 'readline';
import { MasterLoop } from '../core/master-loop';
import { SessionManager } from '../core/session-manager';

export class InteractiveMode {
  private rl: readline.Interface;
  private masterLoop: MasterLoop;
  private sessionManager: SessionManager;
  private isRunning: boolean = false;

  constructor(masterLoop: MasterLoop, sessionManager: SessionManager) {
    this.masterLoop = masterLoop;
    this.sessionManager = sessionManager;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'edgar> '
    });
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    console.log('Welcome to Edgar! Type /help for available commands.');
    
    this.rl.prompt();

    this.rl.on('line', async (line: string) => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('/')) {
        await this.handleCommand(trimmedLine);
      } else if (trimmedLine.toLowerCase() === 'exit') {
        this.stop();
      } else if (trimmedLine) {
        await this.handleUserInput(trimmedLine);
      }

      if (this.isRunning) {
        this.rl.prompt();
      }
    });

    this.rl.on('close', () => {
      console.log('Goodbye!');
      process.exit(0);
    });

    // Keep the process running
    return new Promise(() => {});
  }

  private async handleCommand(command: string): Promise<void> {
    switch (command) {
      case '/clear':
        await this.sessionManager.clearCurrentSession();
        console.log('Conversation history cleared.');
        break;
      
      case '/help':
        this.showHelp();
        break;
      
      case '/settings':
        console.log('Settings command - not yet implemented');
        break;
      
      case '/exit':
        this.stop();
        break;
      
      default:
        console.log(`Unknown command: ${command}`);
    }
  }

  private async handleUserInput(input: string): Promise<void> {
    try {
      console.log('Processing your request...');
      await this.masterLoop.executeTask(input);
    } catch (error) {
      console.error('Error processing request:', error);
    }
  }

  private showHelp(): void {
    console.log('Available commands:');
    console.log('  /clear    - Clear conversation history');
    console.log('  /help     - Show this help message');
    console.log('  /settings - Configure settings');
    console.log('  /exit     - Exit Edgar');
    console.log('  exit      - Exit Edgar');
  }

  public stop(): void {
    this.isRunning = false;
    this.rl.close();
  }
}