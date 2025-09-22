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
exports.LLMProviderFactory = exports.OutputStyleManager = exports.SubagentManager = exports.BaseTool = exports.ToolManager = exports.SessionManager = exports.MasterLoop = exports.ConfigManager = exports.EdgarCLI = void 0;
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
const path_utils_1 = require("./config/path-utils");
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
const program = new commander_1.Command();
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
    console.log(chalk_1.default.cyan(`\n🤖 Edgar v${version} - AI Coding Assistant`));
    console.log(chalk_1.default.gray('Type "exit" to quit, "help" for commands\n'));
    // Initialize components
    const spinner = (0, ora_1.default)('Initializing Edgar...').start();
    try {
        // Ensure directory structure exists
        (0, path_utils_1.ensureDirectoryStructure)();
        // Initialize managers
        const configManager = new config_manager_1.ConfigManager();
        const toolManager = new tool_manager_1.ToolManager();
        const outputStyleManager = new output_style_manager_1.OutputStyleManager();
        const llmProvider = llm_provider_factory_1.LLMProviderFactory.create(options.provider);
        const subagentManager = new subagent_manager_1.SubagentManager(toolManager, llmProvider);
        // Set output style if specified
        if (options.style) {
            outputStyleManager.setActiveStyle(options.style);
        }
        const masterLoop = new master_loop_v2_1.MasterLoop(llmProvider, toolManager, undefined, // HookManager
        outputStyleManager);
        spinner.succeed('Edgar initialized successfully!\n');
        // Start interactive loop
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
            if (input.toLowerCase() === 'help') {
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
});
// Task execution mode
program
    .command('task <description>')
    .description('Execute a specific task')
    .option('-s, --style <style>', 'Set output style')
    .option('-p, --provider <provider>', 'Set LLM provider')
    .action(async (description, options) => {
    const spinner = (0, ora_1.default)('Executing task...').start();
    try {
        (0, path_utils_1.ensureDirectoryStructure)();
        const toolManager = new tool_manager_1.ToolManager();
        const outputStyleManager = new output_style_manager_1.OutputStyleManager();
        const llmProvider = llm_provider_factory_1.LLMProviderFactory.create(options.provider);
        if (options.style) {
            outputStyleManager.setActiveStyle(options.style);
        }
        const masterLoop = new master_loop_v2_1.MasterLoop(llmProvider, toolManager, undefined, outputStyleManager);
        await masterLoop.executeTask(description);
        spinner.succeed('Task completed successfully!');
    }
    catch (error) {
        spinner.fail('Task execution failed');
        console.error(chalk_1.default.red('Error:'), error.message);
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
    const spinner = (0, ora_1.default)('Processing query...').start();
    try {
        (0, path_utils_1.ensureDirectoryStructure)();
        const toolManager = new tool_manager_1.ToolManager();
        const outputStyleManager = new output_style_manager_1.OutputStyleManager();
        const llmProvider = llm_provider_factory_1.LLMProviderFactory.create(options.provider);
        if (options.style) {
            outputStyleManager.setActiveStyle(options.style);
        }
        const masterLoop = new master_loop_v2_1.MasterLoop(llmProvider, toolManager, undefined, outputStyleManager);
        const response = await masterLoop.executeQuery(question);
        spinner.stop();
        console.log('\n' + chalk_1.default.blue('Answer:'), response);
    }
    catch (error) {
        spinner.fail('Query failed');
        console.error(chalk_1.default.red('Error:'), error.message);
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
    const configManager = new config_manager_1.ConfigManager();
    if (options.list) {
        const config = configManager.getAll();
        console.log(chalk_1.default.cyan('\nCurrent Configuration:'));
        Object.entries(config).forEach(([key, value]) => {
            console.log(`  ${chalk_1.default.yellow(key)}: ${value}`);
        });
    }
    else if (options.set) {
        const [key, value] = options.set.split('=');
        configManager.set(key, value);
        configManager.save();
        console.log(chalk_1.default.green(`✓ Set ${key} = ${value}`));
    }
    else if (options.get) {
        const value = configManager.get(options.get);
        console.log(`${chalk_1.default.yellow(options.get)}: ${value || 'Not set'}`);
    }
    else {
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
    const styleManager = new output_style_manager_1.OutputStyleManager();
    if (options.list) {
        const styles = styleManager.listStyles();
        const activeStyle = styleManager.getActiveStyle();
        console.log(chalk_1.default.cyan('\nAvailable Styles:'));
        styles.forEach(style => {
            const isActive = activeStyle?.name === style;
            const marker = isActive ? chalk_1.default.green('✓') : ' ';
            console.log(`  ${marker} ${style}`);
        });
    }
    else if (options.set) {
        if (styleManager.setActiveStyle(options.set)) {
            console.log(chalk_1.default.green(`✓ Active style set to: ${options.set}`));
        }
        else {
            console.log(chalk_1.default.red(`✗ Style not found: ${options.set}`));
        }
    }
    else if (options.create) {
        // Interactive style creation
        const answers = await inquirer.prompt([
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
        styleManager.createStyleFromTemplate(answers.baseStyle, options.create, { description: answers.description });
        console.log(chalk_1.default.green(`✓ Created style: ${options.create}`));
    }
    else {
        console.log('Use --list, --set, or --create to manage styles');
    }
});
// Initialize command
program
    .command('init')
    .description('Initialize Edgar in the current directory')
    .action(async () => {
    const spinner = (0, ora_1.default)('Initializing Edgar...').start();
    try {
        (0, path_utils_1.ensureDirectoryStructure)();
        // Create default .edgar.env if it doesn't exist
        const configDirs = (0, path_utils_1.getConfigDir)();
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
        console.log(chalk_1.default.gray(`\nConfiguration directory: ${configDirs.projectPath}`));
        console.log(chalk_1.default.gray(`Edit ${envPath} to add your API keys`));
    }
    catch (error) {
        spinner.fail('Initialization failed');
        console.error(chalk_1.default.red('Error:'), error.message);
        process.exit(1);
    }
});
// Helper functions
function showHelp() {
    console.log(chalk_1.default.cyan('\nAvailable Commands:'));
    console.log('  exit, quit     - Exit Edgar');
    console.log('  help          - Show this help message');
    console.log('  /style <name> - Change output style');
    console.log('  /styles       - List available styles');
    console.log('  /clear        - Clear conversation history');
    console.log('  /save <file>  - Save conversation to file');
    console.log('  /load <file>  - Load conversation from file');
    console.log();
}
async function handleCommand(command, masterLoop, styleManager) {
    const parts = command.slice(1).split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);
    switch (cmd) {
        case 'style':
            if (args.length > 0) {
                if (masterLoop.setOutputStyle(args[0])) {
                    console.log(chalk_1.default.green(`✓ Style changed to: ${args[0]}`));
                }
                else {
                    console.log(chalk_1.default.red(`✗ Unknown style: ${args[0]}`));
                }
            }
            else {
                console.log('Usage: /style <name>');
            }
            break;
        case 'styles':
            const styles = masterLoop.getOutputStyles();
            console.log(chalk_1.default.cyan('Available styles:'), styles.join(', '));
            break;
        case 'clear':
            masterLoop.clearHistory();
            console.log(chalk_1.default.green('✓ Conversation history cleared'));
            break;
        case 'save':
            if (args.length > 0) {
                const history = masterLoop.getMessageHistory();
                fs.writeJsonSync(args[0], history, { spaces: 2 });
                console.log(chalk_1.default.green(`✓ Conversation saved to: ${args[0]}`));
            }
            else {
                console.log('Usage: /save <filename>');
            }
            break;
        case 'load':
            if (args.length > 0 && fs.existsSync(args[0])) {
                const history = fs.readJsonSync(args[0]);
                // Note: Would need to add a method to load history in MasterLoop
                console.log(chalk_1.default.green(`✓ Conversation loaded from: ${args[0]}`));
            }
            else {
                console.log('Usage: /load <filename>');
            }
            break;
        default:
            console.log(chalk_1.default.red(`Unknown command: /${cmd}`));
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
var cli_1 = require("./cli");
Object.defineProperty(exports, "EdgarCLI", { enumerable: true, get: function () { return cli_1.EdgarCLI; } });
var config_manager_2 = require("./config/config-manager");
Object.defineProperty(exports, "ConfigManager", { enumerable: true, get: function () { return config_manager_2.ConfigManager; } });
var master_loop_v2_2 = require("./core/master-loop-v2");
Object.defineProperty(exports, "MasterLoop", { enumerable: true, get: function () { return master_loop_v2_2.MasterLoop; } });
var session_manager_1 = require("./core/session-manager");
Object.defineProperty(exports, "SessionManager", { enumerable: true, get: function () { return session_manager_1.SessionManager; } });
var tool_manager_2 = require("./tools/tool-manager");
Object.defineProperty(exports, "ToolManager", { enumerable: true, get: function () { return tool_manager_2.ToolManager; } });
var base_tool_1 = require("./tools/base-tool");
Object.defineProperty(exports, "BaseTool", { enumerable: true, get: function () { return base_tool_1.BaseTool; } });
var subagent_manager_2 = require("./subagents/subagent-manager");
Object.defineProperty(exports, "SubagentManager", { enumerable: true, get: function () { return subagent_manager_2.SubagentManager; } });
var output_style_manager_2 = require("./output/output-style-manager");
Object.defineProperty(exports, "OutputStyleManager", { enumerable: true, get: function () { return output_style_manager_2.OutputStyleManager; } });
var llm_provider_factory_2 = require("./llm/llm-provider-factory");
Object.defineProperty(exports, "LLMProviderFactory", { enumerable: true, get: function () { return llm_provider_factory_2.LLMProviderFactory; } });
//# sourceMappingURL=index-old.js.map