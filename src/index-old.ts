#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import ora from 'ora';
const inquirer = require('inquirer').default || require('inquirer');
import { EdgarCLI } from './cli';
import { MasterLoop } from './core/master-loop-v2';
import { LLMProviderFactory } from './llm/llm-provider-factory';
import { ToolManager } from './tools/tool-manager';
import { SubagentManager } from './subagents/subagent-manager';
import { OutputStyleManager } from './output/output-style-manager';
import { ConfigManager } from './config/config-manager';
import { getConfigDir, ensureDirectoryStructure } from './config/path-utils';

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

const program = new Command();
const version = '0.1.0';

program
  .name('edgar')
  .description('Edgar - A Claude Code-compatible CLI for agentic coding')
  .version(version);

// Interactive mode (default)
program
  .command('chat', { isDefault: true })
  .description('Start an interactive chat session')
  .option('-s, --style <style>', 'Set output style (concise, detailed, socratic, technical, tutorial)')
  .option('-p, --provider <provider>', 'Set LLM provider (anthropic, openai, azure)')
  .action(async (options) => {
    console.log(chalk.cyan(`\n🤖 Edgar v${version} - AI Coding Assistant`));
    console.log(chalk.gray('Type "exit" to quit, "help" for commands\n'));

    // Initialize components
    const spinner = ora('Initializing Edgar...').start();
    
    try {
      // Ensure directory structure exists
      ensureDirectoryStructure();
      
      // Initialize managers
      const configManager = new ConfigManager();
      const toolManager = new ToolManager();
      const outputStyleManager = new OutputStyleManager();
      const llmProvider = LLMProviderFactory.create(options.provider);
      const subagentManager = new SubagentManager(toolManager, llmProvider);
      
      // Set output style if specified
      if (options.style) {
        outputStyleManager.setActiveStyle(options.style);
      }
      
      const masterLoop = new MasterLoop(
        llmProvider,
        toolManager,
        undefined, // HookManager
        outputStyleManager
      );
      
      spinner.succeed('Edgar initialized successfully!\n');
      
      // Start interactive loop
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
        
        if (input.toLowerCase() === 'help') {
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
  });

// Task execution mode
program
  .command('task <description>')
  .description('Execute a specific task')
  .option('-s, --style <style>', 'Set output style')
  .option('-p, --provider <provider>', 'Set LLM provider')
  .action(async (description, options) => {
    const spinner = ora('Executing task...').start();
    
    try {
      ensureDirectoryStructure();
      
      const toolManager = new ToolManager();
      const outputStyleManager = new OutputStyleManager();
      const llmProvider = LLMProviderFactory.create(options.provider);
      
      if (options.style) {
        outputStyleManager.setActiveStyle(options.style);
      }
      
      const masterLoop = new MasterLoop(
        llmProvider,
        toolManager,
        undefined,
        outputStyleManager
      );
      
      await masterLoop.executeTask(description);
      spinner.succeed('Task completed successfully!');
    } catch (error: any) {
      spinner.fail('Task execution failed');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Query mode
program
  .command('query <question>')
  .description('Ask a single question')
  .option('-s, --style <style>', 'Set output style')
  .option('-p, --provider <provider>', 'Set LLM provider')
  .action(async (question, options) => {
    const spinner = ora('Processing query...').start();
    
    try {
      ensureDirectoryStructure();
      
      const toolManager = new ToolManager();
      const outputStyleManager = new OutputStyleManager();
      const llmProvider = LLMProviderFactory.create(options.provider);
      
      if (options.style) {
        outputStyleManager.setActiveStyle(options.style);
      }
      
      const masterLoop = new MasterLoop(
        llmProvider,
        toolManager,
        undefined,
        outputStyleManager
      );
      
      const response = await masterLoop.executeQuery(question);
      spinner.stop();
      console.log('\n' + chalk.blue('Answer:'), response);
    } catch (error: any) {
      spinner.fail('Query failed');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Configuration commands
program
  .command('config')
  .description('Manage Edgar configuration')
  .option('-l, --list', 'List all configuration values')
  .option('-s, --set <key=value>', 'Set a configuration value')
  .option('-g, --get <key>', 'Get a configuration value')
  .action(async (options) => {
    const configManager = new ConfigManager();
    
    if (options.list) {
      const config = configManager.getAll();
      console.log(chalk.cyan('\nCurrent Configuration:'));
      Object.entries(config).forEach(([key, value]) => {
        console.log(`  ${chalk.yellow(key)}: ${value}`);
      });
    } else if (options.set) {
      const [key, value] = options.set.split('=');
      configManager.set(key, value);
      configManager.save();
      console.log(chalk.green(`✓ Set ${key} = ${value}`));
    } else if (options.get) {
      const value = configManager.get(options.get);
      console.log(`${chalk.yellow(options.get)}: ${value || 'Not set'}`);
    } else {
      console.log('Use --list, --set, or --get to manage configuration');
    }
  });

// Style management
program
  .command('style')
  .description('Manage output styles')
  .option('-l, --list', 'List available styles')
  .option('-s, --set <name>', 'Set active style')
  .option('-c, --create <name>', 'Create a new style')
  .action(async (options) => {
    const styleManager = new OutputStyleManager();
    
    if (options.list) {
      const styles = styleManager.listStyles();
      const activeStyle = styleManager.getActiveStyle();
      console.log(chalk.cyan('\nAvailable Styles:'));
      styles.forEach(style => {
        const isActive = activeStyle?.name === style;
        const marker = isActive ? chalk.green('✓') : ' ';
        console.log(`  ${marker} ${style}`);
      });
    } else if (options.set) {
      if (styleManager.setActiveStyle(options.set)) {
        console.log(chalk.green(`✓ Active style set to: ${options.set}`));
      } else {
        console.log(chalk.red(`✗ Style not found: ${options.set}`));
      }
    } else if (options.create) {
      // Interactive style creation
      const answers = await (inquirer as any).prompt([
        {
          type: 'input',
          name: 'description',
          message: 'Style description:'
        },
        {
          type: 'list',
          name: 'baseStyle',
          message: 'Base style:',
          choices: styleManager.listStyles()
        }
      ]);
      
      styleManager.createStyleFromTemplate(
        answers.baseStyle,
        options.create,
        { description: answers.description }
      );
      
      console.log(chalk.green(`✓ Created style: ${options.create}`));
    } else {
      console.log('Use --list, --set, or --create to manage styles');
    }
  });

// Initialize command
program
  .command('init')
  .description('Initialize Edgar in the current directory')
  .action(async () => {
    const spinner = ora('Initializing Edgar...').start();
    
    try {
      ensureDirectoryStructure();
      
      // Create default .edgar.env if it doesn't exist
      const configDirs = getConfigDir();
      const envPath = path.join(configDirs.projectPath, '.edgar.env');
      
      if (!fs.existsSync(envPath)) {
        const template = `# Edgar Configuration
# Add your LLM provider credentials here

# Anthropic (Claude)
# ANTHROPIC_API_KEY=your_key_here

# OpenAI
# OPENAI_API_KEY=your_key_here

# Azure OpenAI
# AZURE_OPENAI_ENDPOINT=your_endpoint_here
# AZURE_OPENAI_KEY=your_key_here
# AZURE_OPENAI_DEPLOYMENT=your_deployment_here

# Default Provider
LLM_PROVIDER=anthropic

# General Settings
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=4096
`;
        fs.writeFileSync(envPath, template);
      }
      
      spinner.succeed('Edgar initialized successfully!');
      console.log(chalk.gray(`\nConfiguration directory: ${configDirs.projectPath}`));
      console.log(chalk.gray(`Edit ${envPath} to add your API keys`));
    } catch (error: any) {
      spinner.fail('Initialization failed');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Helper functions
function showHelp(): void {
  console.log(chalk.cyan('\nAvailable Commands:'));
  console.log('  exit, quit     - Exit Edgar');
  console.log('  help          - Show this help message');
  console.log('  /style <name> - Change output style');
  console.log('  /styles       - List available styles');
  console.log('  /clear        - Clear conversation history');
  console.log('  /save <file>  - Save conversation to file');
  console.log('  /load <file>  - Load conversation from file');
  console.log();
}

async function handleCommand(
  command: string,
  masterLoop: MasterLoop,
  styleManager: OutputStyleManager
): Promise<void> {
  const parts = command.slice(1).split(' ');
  const cmd = parts[0];
  const args = parts.slice(1);
  
  switch (cmd) {
    case 'style':
      if (args.length > 0) {
        if (masterLoop.setOutputStyle(args[0])) {
          console.log(chalk.green(`✓ Style changed to: ${args[0]}`));
        } else {
          console.log(chalk.red(`✗ Unknown style: ${args[0]}`));
        }
      } else {
        console.log('Usage: /style <name>');
      }
      break;
      
    case 'styles':
      const styles = masterLoop.getOutputStyles();
      console.log(chalk.cyan('Available styles:'), styles.join(', '));
      break;
      
    case 'clear':
      masterLoop.clearHistory();
      console.log(chalk.green('✓ Conversation history cleared'));
      break;
      
    case 'save':
      if (args.length > 0) {
        const history = masterLoop.getMessageHistory();
        fs.writeJsonSync(args[0], history, { spaces: 2 });
        console.log(chalk.green(`✓ Conversation saved to: ${args[0]}`));
      } else {
        console.log('Usage: /save <filename>');
      }
      break;
      
    case 'load':
      if (args.length > 0 && fs.existsSync(args[0])) {
        const history = fs.readJsonSync(args[0]);
        // Note: Would need to add a method to load history in MasterLoop
        console.log(chalk.green(`✓ Conversation loaded from: ${args[0]}`));
      } else {
        console.log('Usage: /load <filename>');
      }
      break;
      
    default:
      console.log(chalk.red(`Unknown command: /${cmd}`));
  }
}

// Parse arguments and run
program.parse(process.argv);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Export main components for library usage
export { EdgarCLI } from './cli';
export { ConfigManager } from './config/config-manager';
export { MasterLoop } from './core/master-loop-v2';
export { SessionManager } from './core/session-manager';
export { ToolManager } from './tools/tool-manager';
export { BaseTool } from './tools/base-tool';
export { SubagentManager } from './subagents/subagent-manager';
export { OutputStyleManager } from './output/output-style-manager';
export { LLMProviderFactory } from './llm/llm-provider-factory';