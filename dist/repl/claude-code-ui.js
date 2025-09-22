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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeCodeUI = void 0;
const blessed = __importStar(require("blessed"));
// Whimsical processing verbs for Claude Code style
const PROCESSING_VERBS = [
    'Cogitating', 'Pondering', 'Contemplating', 'Ruminating',
    'Frobnicating', 'Noodling', 'Percolating', 'Marinating',
    'Synthesizing', 'Ideating', 'Brainstorming', 'Musing',
    'Deliberating', 'Meditating', 'Philosophizing', 'Considering'
];
// ASCII sprites for animated cursor
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
class ClaudeCodeUI {
    screen;
    outputBox;
    inputBox;
    statusBar;
    processingIndicator;
    masterLoop;
    outputStyleManager;
    isProcessing = false;
    spinnerFrame = 0;
    spinnerInterval = null;
    currentVerb = '';
    // Context tracking for status bar
    messageCount = 0;
    sessionStartTime = new Date();
    currentMode = 'chat';
    constructor(masterLoop, outputStyleManager) {
        this.masterLoop = masterLoop;
        this.outputStyleManager = outputStyleManager;
        // Create the screen
        this.screen = blessed.screen({
            smartCSR: true,
            fullUnicode: true,
            title: 'Edgar - Claude Code Compatible'
        });
        // Create output area (scrollable, top section)
        this.outputBox = blessed.box({
            top: 0,
            left: 0,
            width: '100%',
            height: '100%-5', // Leave space for input and status
            scrollable: true,
            alwaysScroll: true,
            mouse: true,
            keys: true,
            vi: true,
            scrollbar: {
                ch: '│',
                track: {
                    bg: 'grey'
                },
                style: {
                    inverse: true
                }
            },
            style: {
                fg: 'white',
                bg: 'black'
            },
            tags: true
        });
        // Processing indicator (above input box)
        this.processingIndicator = blessed.box({
            bottom: 4,
            left: 2,
            width: '100%-4',
            height: 1,
            content: '',
            style: {
                fg: 'cyan',
                bg: 'black'
            },
            tags: true
        });
        // Create input box (fixed at bottom)
        this.inputBox = blessed.textbox({
            bottom: 2,
            left: 1,
            width: '100%-2',
            height: 3,
            inputOnFocus: true,
            mouse: true,
            keys: true,
            style: {
                fg: 'white',
                bg: 'grey',
                focus: {
                    fg: 'white',
                    bg: '#333'
                }
            },
            border: {
                type: 'line',
                fg: 'cyan'
            },
            label: ' {cyan-fg}>{/cyan-fg} '
        });
        // Create status bar (bottom line)
        this.statusBar = blessed.box({
            bottom: 0,
            left: 0,
            width: '100%',
            height: 1,
            style: {
                fg: 'black',
                bg: 'white'
            },
            tags: true
        });
        // Add all elements to screen
        this.screen.append(this.outputBox);
        this.screen.append(this.processingIndicator);
        this.screen.append(this.inputBox);
        this.screen.append(this.statusBar);
        // Set up event handlers
        this.setupEventHandlers();
        // Update status bar
        this.updateStatusBar();
        // Initial welcome message
        this.appendOutput('{white-fg}edgar{/white-fg}\n', 'system');
    }
    setupEventHandlers() {
        // Handle input submission
        this.inputBox.on('submit', async (value) => {
            if (!value.trim()) {
                this.inputBox.clearValue();
                this.inputBox.focus();
                this.screen.render();
                return;
            }
            // Handle commands
            if (value === 'exit' || value === 'quit') {
                return this.shutdown();
            }
            if (value === '/clear') {
                await this.clearConversation();
                return;
            }
            if (value === '/help') {
                this.showHelp();
                this.inputBox.clearValue();
                this.inputBox.focus();
                this.screen.render();
                return;
            }
            // Process message
            this.processMessage(value);
        });
        // Handle escape/quit
        this.screen.key(['escape', 'q', 'C-c'], () => {
            this.shutdown();
        });
        // Allow scrolling in output box
        this.outputBox.key(['up', 'down', 'pageup', 'pagedown'], () => {
            this.screen.render();
        });
        // Focus management
        this.inputBox.key('tab', () => {
            this.outputBox.focus();
        });
        this.outputBox.key('tab', () => {
            this.inputBox.focus();
        });
    }
    async processMessage(input) {
        // Show user input in output
        this.appendOutput(`{cyan-fg}>{/cyan-fg} ${input}`, 'user');
        // Clear input box
        this.inputBox.clearValue();
        // Start processing animation
        this.startProcessingAnimation();
        try {
            // Get response from master loop
            const response = await this.masterLoop.processMessage(input);
            // Stop animation
            this.stopProcessingAnimation();
            // Display response
            this.appendOutput(response, 'assistant');
            // Update counts
            this.messageCount++;
            this.updateStatusBar();
        }
        catch (error) {
            this.stopProcessingAnimation();
            this.appendOutput(`{red-fg}Error: ${error.message}{/red-fg}`, 'error');
        }
        // Refocus input
        this.inputBox.focus();
        this.screen.render();
    }
    startProcessingAnimation() {
        this.isProcessing = true;
        // Pick a random verb
        this.currentVerb = PROCESSING_VERBS[Math.floor(Math.random() * PROCESSING_VERBS.length)];
        // Start spinner animation
        this.spinnerInterval = setInterval(() => {
            const frame = SPINNER_FRAMES[this.spinnerFrame];
            this.processingIndicator.setContent(`{cyan-fg}${frame} ${this.currentVerb}...{/cyan-fg}`);
            this.spinnerFrame = (this.spinnerFrame + 1) % SPINNER_FRAMES.length;
            this.screen.render();
        }, 100);
    }
    stopProcessingAnimation() {
        this.isProcessing = false;
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
            this.spinnerInterval = null;
        }
        this.processingIndicator.setContent('');
        this.spinnerFrame = 0;
    }
    appendOutput(text, type) {
        const timestamp = new Date().toLocaleTimeString();
        let styledText = text;
        // Apply color based on type
        switch (type) {
            case 'error':
                // Errors already have red color tag
                break;
            case 'system':
                styledText = `{grey-fg}${text}{/grey-fg}`;
                break;
            case 'user':
                // User input already has cyan > prefix
                break;
            case 'assistant':
                // Model output in white (default)
                styledText = text;
                break;
        }
        // Add to output with some spacing
        const currentContent = this.outputBox.getContent();
        this.outputBox.setContent(currentContent + styledText + '\n\n');
        // Scroll to bottom
        this.outputBox.setScrollPerc(100);
        this.screen.render();
    }
    updateStatusBar() {
        const uptime = this.getUptime();
        const mode = `Mode: ${this.currentMode}`;
        const messages = `Messages: ${this.messageCount}`;
        const context = `Context: ${process.cwd().split('/').pop()}`;
        const statusContent = ` ${mode} │ ${messages} │ ${context} │ ${uptime} `;
        this.statusBar.setContent(statusContent);
        this.screen.render();
    }
    getUptime() {
        const now = new Date();
        const diff = now.getTime() - this.sessionStartTime.getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    }
    async clearConversation() {
        await this.masterLoop.clearHistory();
        this.outputBox.setContent('');
        this.appendOutput('{grey-fg}Conversation cleared{/grey-fg}', 'system');
        this.messageCount = 0;
        this.updateStatusBar();
        this.inputBox.clearValue();
        this.inputBox.focus();
        this.screen.render();
    }
    showHelp() {
        const helpText = `
{cyan-fg}Commands:{/cyan-fg}
  /clear    Clear conversation
  /help     Show this help
  exit      Exit edgar
  
{cyan-fg}Navigation:{/cyan-fg}
  Tab       Switch focus between input and output
  Up/Down   Scroll output when focused
  PgUp/PgDn Scroll output by page
  
{cyan-fg}File references:{/cyan-fg}
  @file     Reference a file in your message`;
        this.appendOutput(helpText, 'system');
    }
    shutdown() {
        this.stopProcessingAnimation();
        process.exit(0);
    }
    async start() {
        // Focus input box
        this.inputBox.focus();
        // Render the screen
        this.screen.render();
    }
}
exports.ClaudeCodeUI = ClaudeCodeUI;
//# sourceMappingURL=claude-code-ui.js.map