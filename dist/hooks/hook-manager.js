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
exports.HookManager = void 0;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
class HookManager {
    config;
    hooks = new Map();
    constructor(_config) {
        this.config = _config;
        this.loadHooks();
    }
    loadHooks() {
        // Load user hooks
        const userHooksPath = path.join(process.env.HOME || '', '.edgar', 'hooks.json');
        if (fs.existsSync(userHooksPath)) {
            try {
                const userHooks = fs.readJsonSync(userHooksPath);
                this.mergeHooks(userHooks);
            }
            catch (error) {
                console.error('Error loading user hooks:', error);
            }
        }
        // Load project hooks (higher priority)
        const projectHooksPath = path.join(process.cwd(), '.edgar', 'hooks.json');
        if (fs.existsSync(projectHooksPath)) {
            try {
                const projectHooks = fs.readJsonSync(projectHooksPath);
                this.mergeHooks(projectHooks);
            }
            catch (error) {
                console.error('Error loading project hooks:', error);
            }
        }
    }
    mergeHooks(hookConfig) {
        if (hookConfig.hooks) {
            for (const [hookType, hooks] of Object.entries(hookConfig.hooks)) {
                const existingHooks = this.hooks.get(hookType) || [];
                this.hooks.set(hookType, [...existingHooks, ...hooks]);
            }
        }
    }
    async fireHook(hookType, context = {}) {
        const hooks = this.hooks.get(hookType) || [];
        for (const hook of hooks) {
            try {
                if (hook.matcher) {
                    // Check if the hook should run based on matcher
                    if (!this.matchesContext(hook.matcher, context)) {
                        continue;
                    }
                }
                if (hook.type === 'command' && hook.command) {
                    await this.executeCommand(hook.command, context);
                }
                else if (hook.type === 'script' && hook.script) {
                    await this.executeScript(hook.script, context);
                }
            }
            catch (error) {
                console.error(`Error executing hook ${hookType}:`, error);
                // Decide whether to continue or stop based on hook configuration
            }
        }
    }
    matchesContext(matcher, context) {
        // Simple matcher implementation
        // In a real implementation, this would be more sophisticated
        if (context.tool && matcher === context.tool) {
            return true;
        }
        return false;
    }
    async executeCommand(command, context) {
        try {
            // Set environment variables from context
            const env = {
                ...process.env,
                EDGAR_CONTEXT: JSON.stringify(context)
            };
            (0, child_process_1.execSync)(command, {
                env,
                stdio: 'inherit'
            });
        }
        catch (error) {
            throw new Error(`Hook command failed: ${command}`);
        }
    }
    async executeScript(scriptPath, context) {
        // Execute a script file
        const resolvedPath = path.resolve(scriptPath);
        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`Hook script not found: ${scriptPath}`);
        }
        await this.executeCommand(resolvedPath, context);
    }
    getHooks(hookType) {
        return this.hooks.get(hookType) || [];
    }
    clearHooks() {
        this.hooks.clear();
    }
}
exports.HookManager = HookManager;
//# sourceMappingURL=hook-manager.js.map