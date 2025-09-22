"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationManager = void 0;
const uuid_1 = require("uuid");
const session_storage_1 = require("./session-storage");
class ConversationManager {
    currentSession = null;
    storage;
    constructor() {
        this.storage = new session_storage_1.SessionStorage();
    }
    async startSession(options = {}) {
        // Handle --continue flag
        if (options.continue) {
            const continued = await this.continueSession();
            if (continued) {
                return continued;
            }
        }
        // Handle specific session ID
        if (options.sessionId) {
            const loaded = await this.storage.load(options.sessionId);
            if (loaded) {
                this.currentSession = loaded;
                return loaded;
            }
        }
        // Create new session
        const session = {
            id: (0, uuid_1.v4)(),
            projectPath: process.cwd(),
            created: new Date(),
            updated: new Date(),
            metadata: {
                version: '1.0.0',
                tokenCount: 0,
                messageCount: 0,
                toolCallCount: 0,
                tags: []
            },
            conversation: [],
            environment: await this.captureEnvironment(),
            compressed: []
        };
        this.currentSession = session;
        await this.storage.save(session);
        return session;
    }
    async continueSession() {
        const recent = await this.storage.findMostRecent(process.cwd());
        if (recent) {
            this.currentSession = recent;
            // Update environment to current state
            this.currentSession.environment = await this.captureEnvironment();
            return this.currentSession;
        }
        return null;
    }
    async addUserMessage(content) {
        if (!this.currentSession) {
            await this.startSession();
        }
        const entry = {
            id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            role: 'user',
            content,
            tokenCount: this.estimateTokens(content)
        };
        this.currentSession.conversation.push(entry);
        this.currentSession.metadata.messageCount++;
        this.currentSession.metadata.tokenCount += entry.tokenCount;
        await this.storage.save(this.currentSession);
    }
    async addAssistantMessage(content, toolCalls) {
        if (!this.currentSession) {
            return;
        }
        const entry = {
            id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            role: 'assistant',
            content,
            tokenCount: this.estimateTokens(content),
            toolCalls
        };
        this.currentSession.conversation.push(entry);
        this.currentSession.metadata.messageCount++;
        this.currentSession.metadata.tokenCount += entry.tokenCount;
        if (toolCalls) {
            this.currentSession.metadata.toolCallCount += toolCalls.length;
        }
        await this.storage.save(this.currentSession);
    }
    async addSystemMessage(content) {
        if (!this.currentSession) {
            await this.startSession();
        }
        const entry = {
            id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            role: 'system',
            content,
            tokenCount: this.estimateTokens(content)
        };
        this.currentSession.conversation.push(entry);
        this.currentSession.metadata.tokenCount += entry.tokenCount;
        await this.storage.save(this.currentSession);
    }
    getConversationHistory() {
        if (!this.currentSession) {
            return [];
        }
        // Convert conversation entries to LoopMessages
        return this.currentSession.conversation.map(entry => ({
            role: entry.role,
            content: entry.content,
            toolCalls: entry.toolCalls,
            toolResults: entry.toolResults
        }));
    }
    async clearConversation() {
        if (!this.currentSession) {
            return;
        }
        // Archive the current session
        await this.storage.archive(this.currentSession.id);
        // Start a new session
        this.currentSession = null;
        await this.startSession({ newSession: true });
    }
    getCurrentSession() {
        return this.currentSession;
    }
    async listSessions() {
        return this.storage.listSessions(process.cwd());
    }
    async loadSession(sessionId) {
        const session = await this.storage.load(sessionId);
        if (session) {
            this.currentSession = session;
        }
        return session;
    }
    // Utility methods
    estimateTokens(text) {
        // Simple estimation: ~4 characters per token
        // In production, use a proper tokenizer like tiktoken
        return Math.ceil(text.length / 4);
    }
    async captureEnvironment() {
        const cwd = process.cwd();
        // Get CLAUDE.md content if it exists
        let claudeMd;
        try {
            const fs = require('fs-extra');
            const path = require('path');
            const claudeMdPath = path.join(cwd, 'CLAUDE.md');
            if (fs.existsSync(claudeMdPath)) {
                claudeMd = fs.readFileSync(claudeMdPath, 'utf-8');
            }
        }
        catch (error) {
            // Ignore errors
        }
        return {
            cwd,
            files: await this.getTrackedFiles(),
            gitStatus: await this.getGitStatus(),
            envVars: this.getSanitizedEnvVars(),
            claudeMd
        };
    }
    async getTrackedFiles() {
        // Track recently accessed files from the current working directory
        const trackedFiles = [];
        const cwd = process.cwd();
        try {
            const { execSync } = require('child_process');
            const fs = require('fs-extra');
            const path = require('path');
            // Try to use git to get recently modified tracked files
            let filePaths = [];
            try {
                const gitFiles = execSync('git ls-files --modified --others --exclude-standard | head -20', {
                    cwd,
                    encoding: 'utf-8'
                }).trim().split('\n').filter(Boolean);
                filePaths = gitFiles;
            }
            catch {
                // Not a git repo, fall back to find command
                try {
                    const recentFiles = execSync('find . -type f -name "*.js" -o -name "*.ts" -o -name "*.json" -o -name "*.md" | grep -v node_modules | grep -v ".git" | head -20', { cwd, encoding: 'utf-8' }).trim().split('\n').filter(Boolean);
                    filePaths = recentFiles.map((f) => f.replace(/^\.\//, ''));
                }
                catch {
                    // If find fails, just return empty array
                    return [];
                }
            }
            // Convert file paths to FileSnapshot objects
            for (const filePath of filePaths) {
                try {
                    const fullPath = path.join(cwd, filePath);
                    const stats = fs.statSync(fullPath);
                    trackedFiles.push({
                        path: filePath,
                        modified: stats.mtime,
                        size: stats.size
                    });
                }
                catch {
                    // Skip files that can't be accessed
                }
            }
        }
        catch {
            // Ignore errors and return what we have
        }
        return trackedFiles;
    }
    async getGitStatus() {
        try {
            const { execSync } = require('child_process');
            const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
            return { branch, modified: [], staged: [], untracked: [] };
        }
        catch (error) {
            return undefined;
        }
    }
    getSanitizedEnvVars() {
        const sanitized = {};
        const allowedKeys = ['NODE_ENV', 'LLM_PROVIDER', 'PWD', 'USER', 'HOME'];
        for (const key of allowedKeys) {
            if (process.env[key]) {
                sanitized[key] = process.env[key];
            }
        }
        return sanitized;
    }
}
exports.ConversationManager = ConversationManager;
//# sourceMappingURL=conversation-manager.js.map