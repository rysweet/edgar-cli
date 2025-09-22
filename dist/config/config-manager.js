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
exports.ConfigManager = void 0;
const fs = __importStar(require("fs-extra"));
const path_utils_1 = require("./path-utils");
const dotenv = __importStar(require("dotenv"));
class ConfigManager {
    configPaths;
    config = {};
    envConfig = {};
    constructor() {
        // Load environment variables
        dotenv.config();
        this.loadEnvConfig();
        // Get configuration paths (supports both .edgar and .claude)
        this.configPaths = (0, path_utils_1.getConfigPaths)();
        // Optionally migrate from .claude to .edgar
        (0, path_utils_1.migrateConfig)().catch(console.error);
        this.loadConfig();
    }
    loadEnvConfig() {
        // Map environment variables to config
        this.envConfig = {
            provider: process.env.LLM_PROVIDER,
            apiKey: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY,
            azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
            azureApiVersion: process.env.AZURE_OPENAI_API_VERSION,
            azureDeployment: process.env.AZURE_OPENAI_DEPLOYMENT,
            model: process.env.AZURE_OPENAI_MODEL_CHAT || process.env.LLM_MODEL,
            temperature: process.env.LLM_TEMPERATURE ? parseFloat(process.env.LLM_TEMPERATURE) : undefined,
            maxTokens: process.env.LLM_MAX_TOKENS ? parseInt(process.env.LLM_MAX_TOKENS) : undefined,
            maxRetries: process.env.LLM_MAX_RETRIES ? parseInt(process.env.LLM_MAX_RETRIES) : undefined,
            timeout: process.env.LLM_TIMEOUT ? parseInt(process.env.LLM_TIMEOUT) : undefined,
        };
    }
    loadConfig() {
        // Load default configuration
        this.config = this.getDefaultConfig();
        // Merge environment variables (lowest priority after defaults)
        Object.keys(this.envConfig).forEach(key => {
            if (this.envConfig[key] !== undefined) {
                this.config[key] = this.envConfig[key];
            }
        });
        // Load user configuration
        if (fs.existsSync(this.configPaths.userConfigFile)) {
            try {
                const userConfig = fs.readJsonSync(this.configPaths.userConfigFile);
                this.config = { ...this.config, ...userConfig };
            }
            catch (error) {
                console.error('Error loading user configuration:', error);
            }
        }
        // Load project configuration (highest priority)
        if (fs.existsSync(this.configPaths.projectConfigFile)) {
            try {
                const projectConfig = fs.readJsonSync(this.configPaths.projectConfigFile);
                this.config = { ...this.config, ...projectConfig };
            }
            catch (error) {
                console.error('Error loading project configuration:', error);
            }
        }
    }
    getDefaultConfig() {
        return {
            provider: 'anthropic',
            model: 'claude-3-sonnet-20240229',
            maxTokens: 4096,
            temperature: 0.7,
            outputStyle: 'default',
            maxRetries: 3,
            timeout: 120000,
            hooks: {},
            mcpServers: {}
        };
    }
    get(key) {
        return this.config[key];
    }
    set(key, value) {
        this.config[key] = value;
    }
    save(scope = 'user') {
        const configPath = scope === 'user'
            ? this.configPaths.userConfigFile
            : this.configPaths.projectConfigFile;
        const configDir = scope === 'user'
            ? this.configPaths.userConfigDir
            : this.configPaths.projectConfigDir;
        // Ensure directory exists
        (0, path_utils_1.ensureConfigDirectory)(configDir);
        // Save configuration
        fs.writeJsonSync(configPath, this.config, { spaces: 2 });
    }
    getAll() {
        return { ...this.config };
    }
    reset() {
        this.config = this.getDefaultConfig();
        this.loadEnvConfig();
    }
    getConfigPaths() {
        return this.configPaths;
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=config-manager.js.map