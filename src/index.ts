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
import { ConversationManager } from './memory/conversation-manager';
import { ClaudeStyleREPL } from './repl/claude-ui';
import { getConfigDir, ensureDirectoryStructure } from './config/path-utils';

// Check if we're in prompt mode to suppress dotenv output
const isPromptMode = process.argv.some(arg => arg === '-p' || arg === '--prompt');

// Intercept stdout to suppress dotenv messages in prompt mode
const originalWrite = process.stdout.write;
if (isPromptMode) {
  process.stdout.write = function(chunk: any, ...args: any[]): boolean {
    // Filter out dotenv messages
    const str = chunk?.toString() || '';
    if (str.includes('[dotenv@') || str.includes('injecting env')) {
      return true; // Pretend we wrote it
    }
    // @ts-ignore
    return originalWrite.apply(process.stdout, [chunk, ...args]);
  };
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

// Keep stdout filter active until after initialization
// It will be restored when we start executing the prompt

const program = new Command();
const version = '0.1.0';

// Helper to initialize components
async function initializeEdgar(options: { continue?: boolean } = {}) {
  ensureDirectoryStructure();
  
  const configManager = new ConfigManager();
  const toolManager = new ToolManager();
  const outputStyleManager = new OutputStyleManager();
  const llmProvider = LLMProviderFactory.create(); // Use env var, not CLI flag
  const subagentManager = new SubagentManager(toolManager, llmProvider);
  const conversationManager = new ConversationManager();
  
  // Start or continue session BEFORE creating MasterLoop
  const session = await conversationManager.startSession(options);
  
  // Now create MasterLoop which will detect existing conversation
  const masterLoop = new MasterLoop(
    llmProvider,
    toolManager,
    undefined, // HookManager
    outputStyleManager,
    conversationManager
  );
  
  // Log session info in debug mode
  if (process.env.DEBUG) {
    console.log('Session ID:', session.id);
    console.log('Conversation length:', session.conversation.length);
  }
  
  return { masterLoop, outputStyleManager, configManager, conversationManager };
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
      await masterLoop.clearHistory();
      console.log(chalk.yellow('Conversation cleared.'));
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
async function runInteractiveMode(options: { continue?: boolean } = {}) {
  // Always use Claude-style minimal UI - it's the default now
  const { masterLoop, outputStyleManager } = await initializeEdgar(options);
  const repl = new ClaudeStyleREPL(masterLoop, outputStyleManager);
  await repl.start();
}

// Execute single prompt
async function executePrompt(prompt: string, options: { continue?: boolean } = {}) {
  try {
    // Silent initialization for single prompt mode
    const { masterLoop } = await initializeEdgar(options);
    
    // Restore stdout before processing the prompt
    if (isPromptMode) {
      process.stdout.write = originalWrite;
    }
    
    const response = await masterLoop.processMessage(prompt);
    // Output only the response, no extra formatting
    console.log(response);
  } catch (error: any) {
    // Ensure stdout is restored for error output
    if (isPromptMode) {
      process.stdout.write = originalWrite;
    }
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
  .option('-c, --continue', 'Continue from the previous session')
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
      await executePrompt(options.prompt, { continue: options.continue });
    } else {
      // Default to interactive mode (like Claude Code)
      await runInteractiveMode({ continue: options.continue });
    }
  });

// Parse arguments
program.parse(process.argv);

// If no arguments provided, run interactive mode
if (process.argv.length === 2) {
  runInteractiveMode({});
}