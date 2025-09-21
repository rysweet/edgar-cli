import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { getConfigPaths, ensureConfigDirectory, migrateConfig, ConfigPaths } from './path-utils';
import * as dotenv from 'dotenv';

export interface EdgarConfig {
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  outputStyle?: string;
  hooks?: Record<string, any>;
  mcpServers?: Record<string, any>;
  [key: string]: any;
}

export class ConfigManager {
  private configPaths: ConfigPaths;
  private config: EdgarConfig = {};
  private envConfig: Record<string, any> = {};

  constructor() {
    // Load environment variables
    dotenv.config();
    this.loadEnvConfig();
    
    // Get configuration paths (supports both .edgar and .claude)
    this.configPaths = getConfigPaths();
    
    // Optionally migrate from .claude to .edgar
    migrateConfig().catch(console.error);
    
    this.loadConfig();
  }

  private loadEnvConfig(): void {
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

  private loadConfig(): void {
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
      } catch (error) {
        console.error('Error loading user configuration:', error);
      }
    }

    // Load project configuration (highest priority)
    if (fs.existsSync(this.configPaths.projectConfigFile)) {
      try {
        const projectConfig = fs.readJsonSync(this.configPaths.projectConfigFile);
        this.config = { ...this.config, ...projectConfig };
      } catch (error) {
        console.error('Error loading project configuration:', error);
      }
    }
  }

  private getDefaultConfig(): EdgarConfig {
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

  public get<T = any>(key: string): T | undefined {
    return this.config[key] as T;
  }

  public set(key: string, value: any): void {
    this.config[key] = value;
  }

  public save(scope: 'user' | 'project' = 'user'): void {
    const configPath = scope === 'user' 
      ? this.configPaths.userConfigFile 
      : this.configPaths.projectConfigFile;
    
    const configDir = scope === 'user'
      ? this.configPaths.userConfigDir
      : this.configPaths.projectConfigDir;
    
    // Ensure directory exists
    ensureConfigDirectory(configDir);
    
    // Save configuration
    fs.writeJsonSync(configPath, this.config, { spaces: 2 });
  }

  public getAll(): EdgarConfig {
    return { ...this.config };
  }

  public reset(): void {
    this.config = this.getDefaultConfig();
    this.loadEnvConfig();
  }

  public getConfigPaths(): ConfigPaths {
    return this.configPaths;
  }
}