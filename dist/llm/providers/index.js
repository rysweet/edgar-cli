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
exports.PROVIDERS = exports.AzureOpenAIProvider = exports.OpenAIProvider = exports.AnthropicProvider = void 0;
exports.createProvider = createProvider;
exports.getProviderClass = getProviderClass;
// Export all LLM providers
var anthropic_1 = require("./anthropic");
Object.defineProperty(exports, "AnthropicProvider", { enumerable: true, get: function () { return anthropic_1.AnthropicProvider; } });
var openai_1 = require("./openai");
Object.defineProperty(exports, "OpenAIProvider", { enumerable: true, get: function () { return openai_1.OpenAIProvider; } });
var azure_openai_1 = require("./azure-openai");
Object.defineProperty(exports, "AzureOpenAIProvider", { enumerable: true, get: function () { return azure_openai_1.AzureOpenAIProvider; } });
// Provider registry for dynamic provider selection
exports.PROVIDERS = {
    anthropic: () => Promise.resolve().then(() => __importStar(require('./anthropic'))).then(m => m.AnthropicProvider),
    openai: () => Promise.resolve().then(() => __importStar(require('./openai'))).then(m => m.OpenAIProvider),
    'azure-openai': () => Promise.resolve().then(() => __importStar(require('./azure-openai'))).then(m => m.AzureOpenAIProvider),
    azure: () => Promise.resolve().then(() => __importStar(require('./azure-openai'))).then(m => m.AzureOpenAIProvider), // Alias
};
/**
 * Create a provider instance by name
 * @param name - The provider name
 * @param config - The provider configuration
 * @returns A promise that resolves to the provider instance
 */
async function createProvider(name, config) {
    const ProviderClass = await exports.PROVIDERS[name]();
    return new ProviderClass(config);
}
/**
 * Get a provider class by name (synchronous)
 * @param name - The provider name
 * @returns The provider class or undefined
 */
function getProviderClass(name) {
    switch (name.toLowerCase()) {
        case 'anthropic':
            return require('./anthropic').AnthropicProvider;
        case 'openai':
            return require('./openai').OpenAIProvider;
        case 'azure-openai':
        case 'azure':
            return require('./azure-openai').AzureOpenAIProvider;
        default:
            return undefined;
    }
}
//# sourceMappingURL=index.js.map