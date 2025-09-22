import { ConfigPaths } from './path-utils';
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
export declare class ConfigManager {
    private configPaths;
    private config;
    private envConfig;
    constructor();
    private loadEnvConfig;
    private loadConfig;
    private getDefaultConfig;
    get<T = any>(key: string): T | undefined;
    set(key: string, value: any): void;
    save(scope?: 'user' | 'project'): void;
    getAll(): EdgarConfig;
    reset(): void;
    getConfigPaths(): ConfigPaths;
}
//# sourceMappingURL=config-manager.d.ts.map