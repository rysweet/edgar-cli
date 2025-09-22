#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import ora from 'ora';
const inquirer = require('inquirer').default || require('inquirer');
import { MasterLoop } from './core/master-loop-v2';
import { LLMProviderFactory } from './llm/llm-provider-factory';
import { ToolManager } from './tools/tool-manager';
import { SubagentManager } from './subagents/subagent-manager';
import { OutputStyleManager } from './output/output-style-manager';
import { ConfigManager } from './config/config-manager';
import { getConfigDir, ensureDirectoryStructure } from './config/path-utils';

// Check if we're in prompt mode to suppress dotenv output
const isPromptMode = process.argv.some(arg => arg === '-p' || arg === '--prompt');

// Suppress console output during prompt mode
const originalConsoleLog = console.log;
if (isPromptMode) {
  console.log = () => {}; // Temporarily disable console.log
}

// Load environment variables
const configDirs = getConfigDir();
const envPath = path.join(configDirs.projectPath, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Load .edgar.env if it exists
const edgarEnvPath = path.join(configDirs.userPath, '.edgar.env');
if (fs.existsSync(edgarEnvPath)) {
  dotenv.config({ path: edgarEnvPath });
}

// Restore console.log after dotenv loads
if (isPromptMode) {
  console.log = originalConsoleLog;
}

const program = new Command();
const version = '0.1.0';

// Helper to initialize components
async function initializeEdgar() {
  ensureDirectoryStructure();
  
  const configManager = new ConfigManager();
  const toolManager = new ToolManager();
  const outputStyleManager = new OutputStyleManager();
  const llmProvider = LLMProviderFactory.create(); // Use env var, not CLI flag
  const subagentManager = new SubagentManager(toolManager, llmProvider);
  
  const masterLoop = new MasterLoop(
    llmProvider,
    toolManager,
    undefined, // HookManager
    outputStyleManager
  );
  
  return { masterLoop, outputStyleManager, configManager };
}

// Show help for slash commands
function showHelp() {
  console.log(chalk.cyan('\n📚 Available Commands:'));
  console.log(chalk.gray('  /help         - Show this help message'));
  console.log(chalk.gray('  /clear        - Clear the conversation'));
  console.log(chalk.gray('  /save         - Save conversation to file'));
  console.log(chalk.gray('  /load <file>  - Load conversation from file'));
  console.log(chalk.gray('  /style <name> - Change output style'));
  console.log(chalk.gray('  /config       - Show configuration'));
  console.log(chalk.gray('  exit          - Exit Edgar\n'));
}

// Handle slash commands
async function handleCommand(input: string, masterLoop: any, outputStyleManager: any): Promise<void> {
  const parts = input.split(' ');
  const command = parts[0].toLowerCase();
  
  switch (command) {
    case '/help':
      showHelp();
      break;
    case '/clear':
      console.log(chalk.yellow('Conversation cleared.'));
      // TODO: Implement conversation clearing
      break;
    case '/style':
      if (parts[1]) {
        outputStyleManager.setActiveStyle(parts[1]);
        console.log(chalk.green(`Output style changed to: ${parts[1]}`));
      } else {
        console.log(chalk.red('Please specify a style name.'));
      }
      break;
    case '/config':
      console.log(chalk.cyan('Current Configuration:'));
      console.log('  Provider:', process.env.LLM_PROVIDER || 'anthropic');
      console.log('  Temperature:', process.env.LLM_TEMPERATURE || '0.7');
      console.log('  Max Tokens:', process.env.LLM_MAX_TOKENS || '4096');
      break;
    default:
      console.log(chalk.red(`Unknown command: ${command}`));
      console.log(chalk.gray('Type /help for available commands.'));
  }
}

// Interactive mode function
async function runInteractiveMode() {
  console.log(chalk.cyan(`\n🤖 Edgar v${version} - Claude Code Compatible CLI`));
  console.log(chalk.gray('Type "exit" to quit, "/help" for commands\n'));
  
  const spinner = ora('Initializing Edgar...').start();
  
  try {
    const { masterLoop, outputStyleManager } = await initializeEdgar();
    spinner.succeed('Edgar initialized successfully!\n');
    
    let isRunning = true;
    
    while (isRunning) {
      const { input } = await inquirer.prompt([
        {
          type: 'input',
          name: 'input',
          message: chalk.green('You:'),
          prefix: ''
        }
      ]);
      
      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        isRunning = false;
        console.log(chalk.yellow('\nGoodbye! 👋\n'));
        break;
      }
      
      if (input.toLowerCase() === '/help' || input.toLowerCase() === 'help') {
        showHelp();
        continue;
      }
      
      if (input.startsWith('/')) {
        await handleCommand(input, masterLoop, outputStyleManager);
        continue;
      }
      
      // Process user message
      const responseSpinner = ora('Thinking...').start();
      
      try {
        const response = await masterLoop.processMessage(input);
        responseSpinner.stop();
        console.log(chalk.blue('\nEdgar:'), response, '\n');
      } catch (error: any) {
        responseSpinner.fail('Error processing message');
        console.error(chalk.red('Error:'), error.message);
      }
    }
  } catch (error: any) {
    spinner.fail('Failed to initialize Edgar');
    console.error(chalk.red('Error:'), error.message);
    
    // Provide helpful debugging information
    if (error.message.includes('Azure OpenAI')) {
      console.log(chalk.yellow('\nAzure OpenAI Configuration:'));
      console.log('  AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT ? '✓ Set' : '✗ Not set');
      console.log('  AZURE_OPENAI_KEY:', process.env.AZURE_OPENAI_KEY ? '✓ Set' : '✗ Not set');
      console.log('  AZURE_OPENAI_DEPLOYMENT:', process.env.AZURE_OPENAI_DEPLOYMENT ? '✓ Set' : '✗ Not set');
      console.log('\n  Ensure your .env file is properly configured.');
    }
    
    if (process.env.DEBUG) {
      console.error('\nFull error:', error);
    }
    
    process.exit(1);
  }
}

// Execute single prompt
async function executePrompt(prompt: string) {
  try {
    // Silent initialization for single prompt mode
    const { masterLoop } = await initializeEdgar();
    const response = await masterLoop.processMessage(prompt);
    // Output only the response, no extra formatting
    console.log(response);
  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

// Configure CLI - Claude Code compatible
program
  .name('edgar')
  .description('Edgar - Claude Code Compatible CLI')
  .version(version, '-v, --version')
  .option('-p, --prompt <prompt>', 'Execute a single prompt')
  .option('-d, --debug', 'Enable debug mode')
  .option('--no-color', 'Disable colored output')
  .helpOption('-h, --help', 'Display help for command')
  .action(async (options) => {
    // Set debug mode if requested
    if (options.debug) {
      process.env.DEBUG = 'true';
    }
    
    // Handle single prompt execution
    if (options.prompt) {
      await executePrompt(options.prompt);
    } else {
      // Default to interactive mode (like Claude Code)
      await runInteractiveMode();
    }
  });

// Parse arguments
program.parse(process.argv);

// If no arguments provided, run interactive mode
if (process.argv.length === 2) {
  runInteractiveMode();
}