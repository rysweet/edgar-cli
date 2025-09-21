import { ConfigManager } from '../config/config-manager';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';

export type HookType = 
  | 'PreToolUse'
  | 'PostToolUse'
  | 'UserPromptSubmit'
  | 'Notification'
  | 'Stop'
  | 'SubagentStop'
  | 'PreCompact'
  | 'SessionStart'
  | 'SessionEnd';

export interface Hook {
  type: 'command' | 'script';
  command?: string;
  script?: string;
  matcher?: string;
}

export interface HookConfig {
  hooks: Record<string, Hook[]>;
}

export class HookManager {
  private config: ConfigManager;
  private hooks: Map<HookType, Hook[]> = new Map();

  constructor(_config: ConfigManager) {
    this.config = _config;
    this.loadHooks();
  }

  private loadHooks(): void {
    // Load user hooks
    const userHooksPath = path.join(process.env.HOME || '', '.edgar', 'hooks.json');
    if (fs.existsSync(userHooksPath)) {
      try {
        const userHooks = fs.readJsonSync(userHooksPath);
        this.mergeHooks(userHooks);
      } catch (error) {
        console.error('Error loading user hooks:', error);
      }
    }

    // Load project hooks (higher priority)
    const projectHooksPath = path.join(process.cwd(), '.edgar', 'hooks.json');
    if (fs.existsSync(projectHooksPath)) {
      try {
        const projectHooks = fs.readJsonSync(projectHooksPath);
        this.mergeHooks(projectHooks);
      } catch (error) {
        console.error('Error loading project hooks:', error);
      }
    }
  }

  private mergeHooks(hookConfig: any): void {
    if (hookConfig.hooks) {
      for (const [hookType, hooks] of Object.entries(hookConfig.hooks)) {
        const existingHooks = this.hooks.get(hookType as HookType) || [];
        this.hooks.set(hookType as HookType, [...existingHooks, ...(hooks as Hook[])]);
      }
    }
  }

  public async fireHook(hookType: HookType, context: any = {}): Promise<void> {
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
        } else if (hook.type === 'script' && hook.script) {
          await this.executeScript(hook.script, context);
        }
      } catch (error) {
        console.error(`Error executing hook ${hookType}:`, error);
        // Decide whether to continue or stop based on hook configuration
      }
    }
  }

  private matchesContext(matcher: string, context: any): boolean {
    // Simple matcher implementation
    // In a real implementation, this would be more sophisticated
    if (context.tool && matcher === context.tool) {
      return true;
    }
    return false;
  }

  private async executeCommand(command: string, context: any): Promise<void> {
    try {
      // Set environment variables from context
      const env = {
        ...process.env,
        EDGAR_CONTEXT: JSON.stringify(context)
      };

      execSync(command, {
        env,
        stdio: 'inherit'
      });
    } catch (error) {
      throw new Error(`Hook command failed: ${command}`);
    }
  }

  private async executeScript(scriptPath: string, context: any): Promise<void> {
    // Execute a script file
    const resolvedPath = path.resolve(scriptPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Hook script not found: ${scriptPath}`);
    }

    await this.executeCommand(resolvedPath, context);
  }

  public getHooks(hookType: HookType): Hook[] {
    return this.hooks.get(hookType) || [];
  }

  public clearHooks(): void {
    this.hooks.clear();
  }
}