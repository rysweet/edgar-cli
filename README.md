# Edgar - Claude Code-Compatible CLI for Agentic Coding

[![GitHub Repository](https://img.shields.io/badge/GitHub-edgar--cli-blue)](https://github.com/rysweet/edgar-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

Edgar is a fully functional reimplementation of Claude Code, built using Test-Driven Development (TDD) principles. It provides an AI-powered coding assistant that can help with various software engineering tasks through a command-line interface.

**Repository**: [https://github.com/rysweet/edgar-cli](https://github.com/rysweet/edgar-cli)

## ✅ Project Status: COMPLETE

All major features have been implemented and tested:
- ✅ Real LLM integration (Azure OpenAI, OpenAI, Anthropic)
- ✅ Complete tool suite (Read, Write, Edit, Bash, Glob, Grep, TodoWrite, WebFetch, WebSearch, Task)
- ✅ Full subagent system (21 specialized agents)
- ✅ Output styles system (concise, detailed, socratic, technical, tutorial)
- ✅ .edgar/.claude directory support with migration
- ✅ Working executable with npm link
- ✅ End-to-end testing verified

## Installation

### Quick Start (No Installation)

Run Edgar directly from GitHub using npx:

```bash
# Run Edgar directly without installing
npx github:rysweet/edgar-cli --help

# Or use the full GitHub URL
npx git+https://github.com/rysweet/edgar-cli.git --help

# Start an interactive chat session
npx github:rysweet/edgar-cli chat
```

### Local Installation

#### Prerequisites
- Node.js 18.0 or higher
- npm

```bash
# Clone the repository
git clone https://github.com/rysweet/edgar-cli.git
cd edgar-cli

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link

# Now you can use edgar from anywhere
edgar --help
```

## Features

### Core Functionality
- **Master Agent Loop**: Single-threaded async architecture for processing user requests
- **Tool System**: Comprehensive set of tools for file operations, command execution, and web interactions
- **LLM Integration**: Support for multiple LLM providers (Azure OpenAI, OpenAI, Anthropic)
- **Subagent System**: 21 specialized agents for different tasks
- **Output Styles**: Customizable response formats
- **Configuration Management**: Hierarchical configuration system

### Tools Available
- **Read**: Read files with support for images, PDFs, and Jupyter notebooks
- **Write**: Create or overwrite files with permission preservation
- **Edit**: Make precise string replacements in files
- **Bash**: Execute shell commands with safety filters
- **Glob**: Pattern matching for finding files
- **Grep**: Content search using ripgrep
- **TodoWrite**: Task management and tracking
- **WebFetch**: Fetch and process web content
- **WebSearch**: Search the web
- **Task**: Launch specialized subagents

### Subagents (21 Types)
- **Development**: Builder, Architect, Reviewer, Tester
- **Optimization**: Optimizer, Database, Performance
- **Security**: Security, Authentication, Vulnerability Assessment
- **Integration**: API Designer, Integration, CI/CD Diagnostic
- **Analysis**: Analyzer, Patterns, Ambiguity
- **Workflow**: Improvement Workflow, Cleanup, Pre-commit Diagnostic
- **Specialized**: Prompt Writer, Preference Reviewer, Output Style Setup


## Configuration

### Environment Variables
Create a `.env` file in your project directory:

```env
# Azure OpenAI (Currently Configured)
AZURE_OPENAI_KEY=your_key_here
AZURE_OPENAI_ENDPOINT=your_endpoint_here
AZURE_OPENAI_DEPLOYMENT=your_deployment_name
AZURE_OPENAI_API_VERSION=2025-01-01-preview

# OpenAI
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4

# Anthropic
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-3-sonnet-20240229

# Default Provider
LLM_PROVIDER=azure  # or 'openai', 'anthropic'

# General Settings
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=4096
```

## Usage

### Interactive Chat Mode (Default)
```bash
edgar
# or
edgar chat
```

### Execute a Task
```bash
edgar task "refactor this function to use async/await"
```

### Ask a Question
```bash
edgar query "What is the time complexity of quicksort?"
```

### With Environment Variables
```bash
# If .env is not in current directory
AZURE_OPENAI_KEY=xxx AZURE_OPENAI_ENDPOINT=xxx edgar query "What is 2+2?"
```

### Configuration Management
```bash
# List all configuration
edgar config --list

# Set a configuration value
edgar config --set "provider=anthropic"

# Get a configuration value
edgar config --get provider
```

### Output Style Management
```bash
# List available styles
edgar style --list

# Set active style
edgar style --set detailed

# Create a new style
edgar style --create mystyle
```

## Interactive Commands
When in interactive mode:
- `exit` or `quit` - Exit Edgar
- `help` - Show available commands
- `/style <name>` - Change output style
- `/styles` - List available styles
- `/clear` - Clear conversation history
- `/save <file>` - Save conversation
- `/load <file>` - Load conversation

## Architecture

### Component Overview
```
Master Loop (master-loop-v2.ts)
    ├── LLM Providers
    │   ├── Azure OpenAI
    │   ├── OpenAI
    │   └── Anthropic
    ├── Tool Manager
    │   ├── File Tools (Read, Write, Edit)
    │   ├── Execution Tools (Bash, Task)
    │   ├── Search Tools (Glob, Grep)
    │   └── Web Tools (WebFetch, WebSearch)
    ├── Subagent Manager
    │   └── 21 Specialized Agents
    └── Output Style Manager
        └── 5 Built-in Styles
```

### Directory Structure
```
edgar/
├── src/
│   ├── cli/           # CLI interface
│   ├── config/        # Configuration management
│   ├── core/          # Master loop and session
│   ├── hooks/         # Hook system
│   ├── llm/           # LLM providers
│   │   └── providers/ # Provider implementations
│   ├── output/        # Output styles
│   ├── subagents/     # Subagent system
│   ├── tools/         # Tool implementations
│   └── index.ts       # Main entry point
├── tests/             # Comprehensive test suite
├── dist/              # Compiled JavaScript
├── .env               # Environment configuration
└── .edgar/            # Configuration directory
```

## Testing

### Test Coverage
- **Total Test Suites**: 7
- **Total Tests**: 115+ 
- **All Passing**: ✅
- **TDD Approach**: Tests written first

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Development

### Building
```bash
# Build TypeScript
npm run build

# Clean build
npm run clean

# Development mode
npm run dev
```

### Linting
```bash
# Run ESLint
npm run lint

# Format with Prettier
npm run format
```

## Key Implementation Details

### Circular Dependency Resolution
TaskTool uses lazy initialization to avoid circular dependencies with SubagentManager.

### Azure OpenAI Integration
Supports both base URL and full endpoint URL formats for flexibility.

### Directory Compatibility
- Supports both `.claude` and `.edgar` directories
- Automatic migration from `.claude` to `.edgar`
- Preference for `.edgar` when both exist

### Safety Features
- Command filtering in Bash tool
- Permission preservation in Write tool
- Unique string validation in Edit tool
- Timeout controls for all operations

## Verified Functionality

### Successfully Tested
- ✅ Azure OpenAI integration with GPT-4.1
- ✅ Query processing and response
- ✅ Configuration management
- ✅ Output style system
- ✅ Global installation via npm link
- ✅ Environment variable loading
- ✅ Tool execution

## Troubleshooting

### Environment Variables Not Loading
```bash
# Ensure .env is in current directory or set explicitly:
AZURE_OPENAI_KEY=xxx edgar query "test"
```

### API Key Issues
Verify keys are set correctly and have proper permissions.

### Circular Dependency Errors
Already resolved through lazy initialization in TaskTool.

## License

MIT

## Acknowledgments

Edgar is a reimplementation of Claude Code by Anthropic, built as a comprehensive exercise in:
- Test-Driven Development
- TypeScript architecture
- LLM integration
- Tool system design
- Modular software engineering

## Contributors

Built with Claude's assistance using TDD principles and systematic implementation.

---

**Note**: This project demonstrates a complete, working reimplementation of Claude Code with all major features functional and tested.