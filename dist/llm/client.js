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
exports.LLMClient = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const openai_1 = __importDefault(require("openai"));
const openai_2 = require("openai");
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
class BaseLLMProvider {
    config;
    constructor(config) {
        this.config = config;
    }
}
class AnthropicProvider extends BaseLLMProvider {
    client;
    constructor(config) {
        super(config);
        this.client = new sdk_1.default({
            apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
            baseURL: config.baseUrl,
            maxRetries: config.maxRetries || 3,
            timeout: config.timeout || 120000,
        });
    }
    async sendMessage(messages) {
        try {
            // Convert messages to Anthropic format
            const systemMessage = messages.find(m => m.role === 'system');
            const userMessages = messages.filter(m => m.role !== 'system');
            const response = await this.client.messages.create({
                model: this.config.model || 'claude-3-sonnet-20240229',
                max_tokens: this.config.maxTokens || 4096,
                temperature: this.config.temperature || 0.7,
                system: systemMessage?.content,
                messages: userMessages.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                }))
            });
            return {
                content: response.content[0].type === 'text'
                    ? response.content[0].text
                    : JSON.stringify(response.content[0]),
                usage: {
                    inputTokens: response.usage?.input_tokens,
                    outputTokens: response.usage?.output_tokens,
                }
            };
        }
        catch (error) {
            console.error('Anthropic API Error:', error);
            throw new Error(`Failed to get response from Anthropic: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
class OpenAIProvider extends BaseLLMProvider {
    client;
    constructor(config) {
        super(config);
        this.client = new openai_1.default({
            apiKey: config.apiKey || process.env.OPENAI_API_KEY,
            baseURL: config.baseUrl,
            maxRetries: config.maxRetries || 3,
            timeout: config.timeout || 120000,
        });
    }
    async sendMessage(messages) {
        try {
            // Convert messages to OpenAI format
            const openAIMessages = messages.map(msg => {
                if (msg.role === 'tool') {
                    return {
                        role: 'tool',
                        content: msg.content,
                        tool_call_id: msg.tool_call_id || 'tool_call_' + Date.now()
                    };
                }
                return {
                    role: msg.role,
                    content: msg.content
                };
            });
            const response = await this.client.chat.completions.create({
                model: this.config.model || 'gpt-4-turbo-preview',
                messages: openAIMessages,
                max_tokens: this.config.maxTokens || 4096,
                temperature: this.config.temperature || 0.7,
            });
            const choice = response.choices[0];
            return {
                content: choice.message.content || '',
                toolCalls: choice.message.tool_calls,
                usage: {
                    inputTokens: response.usage?.prompt_tokens,
                    outputTokens: response.usage?.completion_tokens,
                    totalTokens: response.usage?.total_tokens,
                }
            };
        }
        catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error(`Failed to get response from OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
class AzureOpenAIProvider extends BaseLLMProvider {
    client;
    constructor(config) {
        super(config);
        if (!config.azureEndpoint) {
            throw new Error('Azure OpenAI endpoint is required');
        }
        if (!config.apiKey) {
            throw new Error('Azure OpenAI API key is required');
        }
        // Parse the endpoint URL to extract the deployment name if not provided
        let deployment = config.azureDeployment;
        let endpoint = config.azureEndpoint;
        if (!deployment && endpoint.includes('/deployments/')) {
            const match = endpoint.match(/\/deployments\/([^\/]+)/);
            if (match) {
                deployment = match[1];
                // Extract base endpoint without deployment path
                endpoint = endpoint.split('/openai/deployments/')[0];
            }
        }
        this.client = new openai_2.AzureOpenAI({
            endpoint: endpoint,
            apiKey: config.apiKey,
            apiVersion: config.azureApiVersion || '2024-02-15-preview',
            deployment: deployment || 'gpt-4',
        });
    }
    async sendMessage(messages) {
        try {
            const response = await this.client.chat.completions.create({
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                model: this.config.model || this.config.azureDeployment || 'gpt-4',
                max_tokens: this.config.maxTokens || 4096,
                temperature: this.config.temperature || 0.7,
            });
            const choice = response.choices[0];
            return {
                content: choice.message?.content || '',
                toolCalls: choice.message?.tool_calls,
                usage: {
                    inputTokens: response.usage?.prompt_tokens,
                    outputTokens: response.usage?.completion_tokens,
                    totalTokens: response.usage?.total_tokens,
                }
            };
        }
        catch (error) {
            console.error('Azure OpenAI API Error:', error);
            throw new Error(`Failed to get response from Azure OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
class LLMClient {
    provider;
    config;
    constructor(config) {
        this.config = config;
        // Get provider configuration
        const providerName = (config.get('provider') || process.env.LLM_PROVIDER || 'anthropic').toLowerCase();
        const providerConfig = {
            provider: providerName,
            apiKey: config.get('apiKey'),
            baseUrl: config.get('baseUrl'),
            model: config.get('model'),
            azureEndpoint: config.get('azureEndpoint'),
            azureApiVersion: config.get('azureApiVersion'),
            azureDeployment: config.get('azureDeployment'),
            maxTokens: config.get('maxTokens'),
            temperature: config.get('temperature'),
            maxRetries: config.get('maxRetries'),
            timeout: config.get('timeout'),
        };
        // Create the appropriate provider
        switch (providerName) {
            case 'anthropic':
                this.provider = new AnthropicProvider(providerConfig);
                break;
            case 'openai':
                this.provider = new OpenAIProvider(providerConfig);
                break;
            case 'azure':
            case 'azure-openai':
                this.provider = new AzureOpenAIProvider(providerConfig);
                break;
            default:
                throw new Error(`Unsupported LLM provider: ${providerName}. Supported: anthropic, openai, azure`);
        }
        console.log(`Using LLM provider: ${providerName}`);
    }
    async sendMessage(messages) {
        try {
            return await this.provider.sendMessage(messages);
        }
        catch (error) {
            console.error('Error sending message to LLM:', error);
            // Provide a fallback response in development mode
            if (process.env.NODE_ENV === 'development') {
                console.warn('Falling back to mock response in development mode');
                return {
                    content: `[Development Mode] Mock response - Real LLM call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    toolCalls: []
                };
            }
            throw error;
        }
    }
    /**
     * Send a simple prompt and get a response
     */
    async prompt(prompt, systemPrompt) {
        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });
        const response = await this.sendMessage(messages);
        return response.content;
    }
    /**
     * Get information about the current provider configuration
     */
    getProviderInfo() {
        const provider = this.config.get('provider') || 'anthropic';
        const model = this.config.get('model');
        return {
            provider,
            model,
            maxTokens: this.config.get('maxTokens'),
            temperature: this.config.get('temperature'),
            configSource: this.config.getConfigPaths().configDirName,
        };
    }
}
exports.LLMClient = LLMClient;
//# sourceMappingURL=client.js.map