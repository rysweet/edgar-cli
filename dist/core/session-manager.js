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
exports.SessionManager = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
class SessionManager {
    sessionsDir;
    currentSession = null;
    constructor() {
        this.sessionsDir = path.join(os.homedir(), '.edgar', 'sessions');
        this.ensureSessionsDirectory();
    }
    ensureSessionsDirectory() {
        fs.ensureDirSync(this.sessionsDir);
    }
    async createSession() {
        const session = {
            id: this.generateSessionId(),
            created: new Date(),
            updated: new Date(),
            messages: []
        };
        this.currentSession = session;
        await this.saveSession(session);
        return session;
    }
    async continueSession() {
        // Get the most recent session
        const sessions = await this.getAllSessions();
        if (sessions.length === 0) {
            return this.createSession();
        }
        // Sort by updated date and get the most recent
        sessions.sort((a, b) => b.updated.getTime() - a.updated.getTime());
        this.currentSession = sessions[0];
        return this.currentSession;
    }
    async resumeSession() {
        // For now, this is the same as continue
        // In the future, this could show a list of sessions to choose from
        return this.continueSession();
    }
    async clearCurrentSession() {
        if (this.currentSession) {
            this.currentSession.messages = [];
            this.currentSession.updated = new Date();
            await this.saveSession(this.currentSession);
        }
    }
    async addMessage(message) {
        if (!this.currentSession) {
            await this.createSession();
        }
        this.currentSession.messages.push(message);
        this.currentSession.updated = new Date();
        await this.saveSession(this.currentSession);
    }
    getCurrentSession() {
        return this.currentSession;
    }
    async saveSession(session) {
        const sessionPath = path.join(this.sessionsDir, `${session.id}.json`);
        await fs.writeJson(sessionPath, session, { spaces: 2 });
    }
    async getAllSessions() {
        const files = await fs.readdir(this.sessionsDir);
        const sessions = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const sessionPath = path.join(this.sessionsDir, file);
                try {
                    const session = await fs.readJson(sessionPath);
                    // Convert date strings back to Date objects
                    session.created = new Date(session.created);
                    session.updated = new Date(session.updated);
                    session.messages.forEach((msg) => {
                        msg.timestamp = new Date(msg.timestamp);
                    });
                    sessions.push(session);
                }
                catch (error) {
                    console.error(`Error loading session ${file}:`, error);
                }
            }
        }
        return sessions;
    }
    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `session_${timestamp}_${random}`;
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=session-manager.js.map