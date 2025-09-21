import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

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
export function getConfigPaths(): ConfigPaths {
  const homeDir = os.homedir();
  const cwd = process.cwd();
  
  // Check for both directory names
  const edgarUserDir = path.join(homeDir, '.edgar');
  const claudeUserDir = path.join(homeDir, '.claude');
  const edgarProjectDir = path.join(cwd, '.edgar');
  const claudeProjectDir = path.join(cwd, '.claude');
  
  // Determine which directory to use (prefer .edgar)
  let userConfigDir: string;
  let projectConfigDir: string;
  let configDirName: string;
  
  // For user config directory
  if (fs.existsSync(edgarUserDir)) {
    userConfigDir = edgarUserDir;
    configDirName = '.edgar';
  } else if (fs.existsSync(claudeUserDir)) {
    userConfigDir = claudeUserDir;
    configDirName = '.claude';
  } else {
    // Default to .edgar for new installations
    userConfigDir = edgarUserDir;
    configDirName = '.edgar';
  }
  
  // For project config directory (check independently)
  if (fs.existsSync(edgarProjectDir)) {
    projectConfigDir = edgarProjectDir;
  } else if (fs.existsSync(claudeProjectDir)) {
    projectConfigDir = claudeProjectDir;
  } else {
    // Use the same convention as user config
    projectConfigDir = path.join(cwd, configDirName);
  }
  
  return {
    userConfigDir,
    userConfigFile: path.join(userConfigDir, 'settings.json'),
    projectConfigDir,
    projectConfigFile: path.join(projectConfigDir, 'settings.local.json'),
    configDirName
  };
}

/**
 * Check if a configuration directory exists
 */
export function hasConfigDirectory(dirPath: string): boolean {
  return fs.existsSync(dirPath);
}

/**
 * Create configuration directory if it doesn't exist
 */
export function ensureConfigDirectory(dirPath: string): void {
  fs.ensureDirSync(dirPath);
}

/**
 * Migrate configuration from .claude to .edgar if needed
 */
export async function migrateConfig(): Promise<boolean> {
  const homeDir = os.homedir();
  const claudeDir = path.join(homeDir, '.claude');
  const edgarDir = path.join(homeDir, '.edgar');
  
  // Only migrate if .claude exists and .edgar doesn't
  if (fs.existsSync(claudeDir) && !fs.existsSync(edgarDir)) {
    try {
      await fs.copy(claudeDir, edgarDir);
      console.log('Migrated configuration from .claude to .edgar');
      return true;
    } catch (error) {
      console.error('Failed to migrate configuration:', error);
      return false;
    }
  }
  
  return false;
}

/**
 * Get all possible configuration file paths to check
 */
export function getAllConfigPaths(): string[] {
  const homeDir = os.homedir();
  const cwd = process.cwd();
  
  return [
    path.join(homeDir, '.edgar', 'settings.json'),
    path.join(homeDir, '.claude', 'settings.json'),
    path.join(cwd, '.edgar', 'settings.local.json'),
    path.join(cwd, '.claude', 'settings.local.json'),
    path.join(cwd, '.edgar', 'config.json'),
    path.join(cwd, '.claude', 'config.json'),
  ];
}

/**
 * Get configuration directories (alias for compatibility)
 */
export function getConfigDir(): ConfigDirs {
  const paths = getConfigPaths();
  return {
    userPath: paths.userConfigDir,
    projectPath: paths.projectConfigDir
  };
}

/**
 * Ensure directory structure exists
 */
export function ensureDirectoryStructure(): void {
  const paths = getConfigPaths();
  ensureConfigDirectory(paths.userConfigDir);
  ensureConfigDirectory(paths.projectConfigDir);
}

export interface ConfigDirs {
  userPath: string;
  projectPath: string;
}