import * as readline from 'readline';
import chalk from 'chalk';
import { MasterLoop } from '../core/master-loop-v2';
import { OutputStyleManager } from '../output/output-style-manager';
import { FileSnapshot } from '../memory/types';

export class ClaudeStyleREPL {
  private rl: readline.Interface;
  private masterLoop: MasterLoop;
  private outputStyleManager: OutputStyleManager;
  private isRunning: boolean = false;

  constructor(
    masterLoop: MasterLoop,
    outputStyleManager: OutputStyleManager
  ) {
    this.masterLoop = masterLoop;
    this.outputStyleManager = outputStyleManager;
    
    // Create readline interface with minimal prompt
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '', // No visible prompt like Claude Code
      terminal: true
    });
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    
    // Clear screen for clean start
    console.clear();
    
    // Minimal startup - no banners or emojis
    console.log('edgar');
    console.log('');
    
    // Handle line input
    this.rl.on('line', async (input) => {
      await this.handleInput(input.trim());
    });
    
    // Handle Ctrl+C gracefully
    this.rl.on('SIGINT', () => {
      this.shutdown();
    });
    
    // Show cursor and wait for input
    this.showPrompt();
  }
  
  private showPrompt(): void {
    // Just show cursor, no prefix
    process.stdout.write('> ');
  }
  
  private async handleInput(input: string): Promise<void> {
    if (!input) {
      this.showPrompt();
      return;
    }
    
    // Handle special commands
    if (input === 'exit' || input === 'quit') {
      this.shutdown();
      return;
    }
    
    if (input === '/clear') {
      console.clear();
      await this.masterLoop.clearHistory();
      this.showPrompt();
      return;
    }
    
    if (input === '/help') {
      this.showMinimalHelp();
      this.showPrompt();
      return;
    }
    
    // Process message without spinner or "Thinking..." text
    try {
      const response = await this.masterLoop.processMessage(input);
      
      // Display response directly without prefix
      console.log(response);
      console.log(''); // Single blank line
    } catch (error: any) {
      // Minimal error display
      console.error(chalk.red(`Error: ${error.message}`));
    }
    
    // Show prompt for next input
    this.showPrompt();
  }
  
  private showMinimalHelp(): void {
    console.log(`
Commands:
  /clear    Clear conversation
  /help     Show this help
  exit      Exit edgar
  
File references:
  @file.js  Reference a file
  
Tab completion available for file paths.
`);
  }
  
  private shutdown(): void {
    this.isRunning = false;
    console.log(''); // Newline before exit
    process.exit(0);
  }
  
  public stop(): void {
    this.isRunning = false;
    this.rl.close();
  }
}