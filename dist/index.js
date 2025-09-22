#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const inquirer = require('inquirer').default || require('inquirer');
const master_loop_v2_1 = require("./core/master-loop-v2");
const llm_provider_factory_1 = require("./llm/llm-provider-factory");
const tool_manager_1 = require("./tools/tool-manager");
const subagent_manager_1 = require("./subagents/subagent-manager");
const output_style_manager_1 = require("./output/output-style-manager");
const config_manager_1 = require("./config/config-manager");
const conversation_manager_1 = require("./memory/conversation-manager");
const claude_ui_1 = require("./repl/claude-ui");
const path_utils_1 = require("./config/path-utils");
// Check if we're in prompt mode to suppress dotenv output
const isPromptMode = process.argv.some(arg => arg === '-p' || arg === '--prompt');
// Intercept stdout to suppress dotenv messages in prompt mode
const originalWrite = process.stdout.write;
if (isPromptMode) {
    process.stdout.write = function (chunk, ...args) {
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
const configDirs = (0, path_utils_1.getConfigDir)();
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
const program = new commander_1.Command();
const version = '0.1.0';
// Helper to initialize components
async function initializeEdgar(options = {}) {
    (0, path_utils_1.ensureDirectoryStructure)();
    const configManager = new config_manager_1.ConfigManager();
    const toolManager = new tool_manager_1.ToolManager();
    const outputStyleManager = new output_style_manager_1.OutputStyleManager();
    const llmProvider = llm_provider_factory_1.LLMProviderFactory.create(); // Use env var, not CLI flag
    const subagentManager = new subagent_manager_1.SubagentManager(toolManager, llmProvider);
    const conversationManager = new conversation_manager_1.ConversationManager();
    // Start or continue session BEFORE creating MasterLoop
    const session = await conversationManager.startSession(options);
    // Now create MasterLoop which will detect existing conversation
    const masterLoop = new master_loop_v2_1.MasterLoop(llmProvider, toolManager, undefined, // HookManager
    outputStyleManager, conversationManager);
    // Log session info in debug mode
    if (process.env.DEBUG) {
        console.log('Session ID:', session.id);
        console.log('Conversation length:', session.conversation.length);
    }
    return { masterLoop, outputStyleManager, configManager, conversationManager };
}
// Show help for slash commands
function showHelp() {
    console.log(chalk_1.default.cyan('\n📚 Available Commands:'));
    console.log(chalk_1.default.gray('  /help         - Show this help message'));
    console.log(chalk_1.default.gray('  /clear        - Clear the conversation'));
    console.log(chalk_1.default.gray('  /save         - Save conversation to file'));
    console.log(chalk_1.default.gray('  /load <file>  - Load conversation from file'));
    console.log(chalk_1.default.gray('  /style <name> - Change output style'));
    console.log(chalk_1.default.gray('  /config       - Show configuration'));
    console.log(chalk_1.default.gray('  exit          - Exit Edgar\n'));
}
// Handle slash commands
async function handleCommand(input, masterLoop, outputStyleManager) {
    const parts = input.split(' ');
    const command = parts[0].toLowerCase();
    switch (command) {
        case '/help':
            showHelp();
            break;
        case '/clear':
            await masterLoop.clearHistory();
            console.log(chalk_1.default.yellow('Conversation cleared.'));
            break;
        case '/style':
            if (parts[1]) {
                outputStyleManager.setActiveStyle(parts[1]);
                console.log(chalk_1.default.green(`Output style changed to: ${parts[1]}`));
            }
            else {
                console.log(chalk_1.default.red('Please specify a style name.'));
            }
            break;
        case '/config':
            console.log(chalk_1.default.cyan('Current Configuration:'));
            console.log('  Provider:', process.env.LLM_PROVIDER || 'anthropic');
            console.log('  Temperature:', process.env.LLM_TEMPERATURE || '0.7');
            console.log('  Max Tokens:', process.env.LLM_MAX_TOKENS || '4096');
            break;
        default:
            console.log(chalk_1.default.red(`Unknown command: ${command}`));
            console.log(chalk_1.default.gray('Type /help for available commands.'));
    }
}
// Interactive mode function
async function runInteractiveMode(options = {}) {
    // Use Claude-style minimal UI if requested
    if (options.minimal || process.env.EDGAR_MINIMAL_UI === 'true') {
        const { masterLoop, outputStyleManager } = await initializeEdgar(options);
        const repl = new claude_ui_1.ClaudeStyleREPL(masterLoop, outputStyleManager);
        await repl.start();
        return;
    }
    // Original Edgar UI
    console.log(chalk_1.default.cyan(`\n🤖 Edgar v${version} - Claude Code Compatible CLI`));
    console.log(chalk_1.default.gray('Type "exit" to quit, "/help" for commands\n'));
    const spinner = (0, ora_1.default)('Initializing Edgar...').start();
    try {
        const { masterLoop, outputStyleManager, conversationManager } = await initializeEdgar(options);
        spinner.succeed('Edgar initialized successfully!\n');
        let isRunning = true;
        while (isRunning) {
            const { input } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'input',
                    message: chalk_1.default.green('You:'),
                    prefix: ''
                }
            ]);
            if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
                isRunning = false;
                console.log(chalk_1.default.yellow('\nGoodbye! 👋\n'));
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
            const responseSpinner = (0, ora_1.default)('Thinking...').start();
            try {
                const response = await masterLoop.processMessage(input);
                responseSpinner.stop();
                console.log(chalk_1.default.blue('\nEdgar:'), response, '\n');
            }
            catch (error) {
                responseSpinner.fail('Error processing message');
                console.error(chalk_1.default.red('Error:'), error.message);
            }
        }
    }
    catch (error) {
        spinner.fail('Failed to initialize Edgar');
        console.error(chalk_1.default.red('Error:'), error.message);
        // Provide helpful debugging information
        if (error.message.includes('Azure OpenAI')) {
            console.log(chalk_1.default.yellow('\nAzure OpenAI Configuration:'));
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
async function executePrompt(prompt, options = {}) {
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
    }
    catch (error) {
        // Ensure stdout is restored for error output
        if (isPromptMode) {
            process.stdout.write = originalWrite;
        }
        console.error(chalk_1.default.red('Error:'), error.message);
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
    .option('-m, --minimal', 'Use minimal Claude-style interface')
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
    }
    else {
        // Default to interactive mode (like Claude Code)
        await runInteractiveMode({ continue: options.continue, minimal: options.minimal });
    }
});
// Parse arguments
program.parse(process.argv);
// If no arguments provided, run interactive mode
if (process.argv.length === 2) {
    runInteractiveMode({});
}
//# sourceMappingURL=index.js.map