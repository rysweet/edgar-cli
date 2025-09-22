export interface ConfigPaths {
    userConfigDir: string;
    userConfigFile: string;
    projectConfigDir: string;
    projectConfigFile: string;
    configDirName: string;
}
/**
 * Get configuration paths, supporting both .edgar and .claude directories
 * Prefers .edgar if both exist
 */
export declare function getConfigPaths(): ConfigPaths;
/**
 * Check if a configuration directory exists
 */
export declare function hasConfigDirectory(dirPath: string): boolean;
/**
 * Create configuration directory if it doesn't exist
 */
export declare function ensureConfigDirectory(dirPath: string): void;
/**
 * Migrate configuration from .claude to .edgar if needed
 */
export declare function migrateConfig(): Promise<boolean>;
/**
 * Get all possible configuration file paths to check
 */
export declare function getAllConfigPaths(): string[];
/**
 * Get configuration directories (alias for compatibility)
 */
export declare function getConfigDir(): ConfigDirs;
/**
 * Ensure directory structure exists
 */
export declare function ensureDirectoryStructure(): void;
export interface ConfigDirs {
    userPath: string;
    projectPath: string;
}
//# sourceMappingURL=path-utils.d.ts.map