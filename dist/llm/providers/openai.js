"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const axios_1 = __importDefault(require("axios"));
class OpenAIProvider {
    apiKey;
    model;
    baseUrl = 'https://api.openai.com/v1';
    maxTokens;
    temperature;
    topP;
    organization;
    config;
    constructor(config) {
        this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || '';
        this.model = config.model || process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
        this.maxTokens = config.maxTokens || parseInt(process.env.OPENAI_MAX_TOKENS || '512000');
        this.temperature = config.temperature ?? 1.0;
        this.topP = config.topP ?? 1.0;
        this.organization = config.organization || process.env.OPENAI_ORGANIZATION;
        if (config.baseUrl) {
            this.baseUrl = config.baseUrl;
        }
        this.config = {
            apiKey: this.apiKey,
            model: this.model,
            maxTokens: this.maxTokens,
            temperature: this.temperature
        };
        if (!this.apiKey) {
            throw new Error('OpenAI API key is required');
        }
    }
    async complete(messages) {
        const response = await this.sendMessage(messages);
        return response.content;
    }
    getConfig() {
        return this.config;
    }
    async sendMessage(messages) {
        try {
            // Convert messages to OpenAI format
            const openAIMessages = messages.map(msg => {
                if (msg.role === 'tool') {
                    return {
                        role: 'tool',
                        content: msg.content,
                        tool_call_id: 'tool_call_' + Date.now() // Generate a simple ID
                    };
                }
                return {
                    role: msg.role === 'system' ? 'system' :
                        msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                };
            });
            const headers = {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            };
            if (this.organization) {
                headers['OpenAI-Organization'] = this.organization;
            }
            const response = await axios_1.default.post(`${this.baseUrl}/chat/completions`, {
                model: this.model,
                messages: openAIMessages,
                max_tokens: this.maxTokens,
                temperature: this.temperature,
                top_p: this.topP,
                tools: this.getToolDefinitions(),
                tool_choice: 'auto'
            }, { headers });
            return this.parseResponse(response.data);
        }
        catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Invalid OpenAI API key');
            }
            if (error.response?.status === 429) {
                throw new Error('OpenAI API rate limit exceeded');
            }
            if (error.response?.status === 404) {
                throw new Error(`Model ${this.model} not found or not accessible`);
            }
            throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
        }
    }
    parseResponse(data) {
        const response = {
            content: '',
            toolCalls: []
        };
        // Parse the first choice
        const choice = data.choices?.[0];
        if (!choice) {
            throw new Error('No response from OpenAI');
        }
        const message = choice.message;
        // Extract content
        if (message.content) {
            response.content = message.content;
        }
        // Extract tool calls
        if (message.tool_calls && Array.isArray(message.tool_calls)) {
            response.toolCalls = message.tool_calls.map((toolCall) => ({
                name: toolCall.function.name,
                parameters: JSON.parse(toolCall.function.arguments || '{}')
            }));
        }
        return response;
    }
    getToolDefinitions() {
        return [
            {
                type: 'function',
                function: {
                    name: 'Read',
                    description: 'Read a file from the filesystem',
                    parameters: {
                        type: 'object',
                        properties: {
                            file_path: {
                                type: 'string',
                                description: 'Absolute path to the file'
                            },
                            offset: {
                                type: 'number',
                                description: 'Line offset to start reading from'
                            },
                            limit: {
                                type: 'number',
                                description: 'Number of lines to read'
                            }
                        },
                        required: ['file_path']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'Write',
                    description: 'Write content to a file',
                    parameters: {
                        type: 'object',
                        properties: {
                            file_path: {
                                type: 'string',
                                description: 'Absolute path to the file'
                            },
                            content: {
                                type: 'string',
                                description: 'Content to write to the file'
                            }
                        },
                        required: ['file_path', 'content']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'Edit',
                    description: 'Edit a file by replacing strings',
                    parameters: {
                        type: 'object',
                        properties: {
                            file_path: {
                                type: 'string',
                                description: 'Absolute path to the file'
                            },
                            old_string: {
                                type: 'string',
                                description: 'String to replace in the file'
                            },
                            new_string: {
                                type: 'string',
                                description: 'Replacement string'
                            },
                            replace_all: {
                                type: 'boolean',
                                description: 'Replace all occurrences'
                            }
                        },
                        required: ['file_path', 'old_string', 'new_string']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'Bash',
                    description: 'Execute a bash command',
                    parameters: {
                        type: 'object',
                        properties: {
                            command: {
                                type: 'string',
                                description: 'Command to execute'
                            },
                            timeout: {
                                type: 'number',
                                description: 'Timeout in milliseconds'
                            },
                            working_directory: {
                                type: 'string',
                                description: 'Working directory for command execution'
                            }
                        },
                        required: ['command']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'Glob',
                    description: 'Search for files matching a pattern',
                    parameters: {
                        type: 'object',
                        properties: {
                            pattern: {
                                type: 'string',
                                description: 'Glob pattern to match files'
                            },
                            path: {
                                type: 'string',
                                description: 'Directory to search in'
                            }
                        },
                        required: ['pattern']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'Grep',
                    description: 'Search file contents with pattern',
                    parameters: {
                        type: 'object',
                        properties: {
                            pattern: {
                                type: 'string',
                                description: 'Search pattern (regex)'
                            },
                            path: {
                                type: 'string',
                                description: 'Path to search in'
                            },
                            output_mode: {
                                type: 'string',
                                enum: ['content', 'files_with_matches', 'count'],
                                description: 'Output format for search results'
                            }
                        },
                        required: ['pattern']
                    }
                }
            }
        ];
    }
}
exports.OpenAIProvider = OpenAIProvider;
//# sourceMappingURL=openai.js.map