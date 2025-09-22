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
exports.getConfigPaths = getConfigPaths;
exports.hasConfigDirectory = hasConfigDirectory;
exports.ensureConfigDirectory = ensureConfigDirectory;
exports.migrateConfig = migrateConfig;
exports.getAllConfigPaths = getAllConfigPaths;
exports.getConfigDir = getConfigDir;
exports.ensureDirectoryStructure = ensureDirectoryStructure;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Get configuration paths, supporting both .edgar and .claude directories
 * Prefers .edgar if both exist
 */
function getConfigPaths() {
    const homeDir = os.homedir();
    const cwd = process.cwd();
    // Check for both directory names
    const edgarUserDir = path.join(homeDir, '.edgar');
    const claudeUserDir = path.join(homeDir, '.claude');
    const edgarProjectDir = path.join(cwd, '.edgar');
    const claudeProjectDir = path.join(cwd, '.claude');
    // Determine which directory to use (prefer .edgar)
    let userConfigDir;
    let projectConfigDir;
    let configDirName;
    // For user config directory
    if (fs.existsSync(edgarUserDir)) {
        userConfigDir = edgarUserDir;
        configDirName = '.edgar';
    }
    else if (fs.existsSync(claudeUserDir)) {
        userConfigDir = claudeUserDir;
        configDirName = '.claude';
    }
    else {
        // Default to .edgar for new installations
        userConfigDir = edgarUserDir;
        configDirName = '.edgar';
    }
    // For project config directory (check independently)
    if (fs.existsSync(edgarProjectDir)) {
        projectConfigDir = edgarProjectDir;
    }
    else if (fs.existsSync(claudeProjectDir)) {
        projectConfigDir = claudeProjectDir;
    }
    else {
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
function hasConfigDirectory(dirPath) {
    return fs.existsSync(dirPath);
}
/**
 * Create configuration directory if it doesn't exist
 */
function ensureConfigDirectory(dirPath) {
    fs.ensureDirSync(dirPath);
}
/**
 * Migrate configuration from .claude to .edgar if needed
 */
async function migrateConfig() {
    const homeDir = os.homedir();
    const claudeDir = path.join(homeDir, '.claude');
    const edgarDir = path.join(homeDir, '.edgar');
    // Only migrate if .claude exists and .edgar doesn't
    if (fs.existsSync(claudeDir) && !fs.existsSync(edgarDir)) {
        try {
            await fs.copy(claudeDir, edgarDir);
            console.log('Migrated configuration from .claude to .edgar');
            return true;
        }
        catch (error) {
            console.error('Failed to migrate configuration:', error);
            return false;
        }
    }
    return false;
}
/**
 * Get all possible configuration file paths to check
 */
function getAllConfigPaths() {
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
function getConfigDir() {
    const paths = getConfigPaths();
    return {
        userPath: paths.userConfigDir,
        projectPath: paths.projectConfigDir
    };
}
/**
 * Ensure directory structure exists
 */
function ensureDirectoryStructure() {
    const paths = getConfigPaths();
    ensureConfigDirectory(paths.userConfigDir);
    ensureConfigDirectory(paths.projectConfigDir);
}
//# sourceMappingURL=path-utils.js.map