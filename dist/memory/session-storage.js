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
exports.SessionStorage = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const path_utils_1 = require("../config/path-utils");
class SessionStorage {
    sessionsDir;
    indexPath;
    constructor() {
        const configDirs = (0, path_utils_1.getConfigDir)();
        this.sessionsDir = path.join(configDirs.userPath, 'sessions');
        this.indexPath = path.join(this.sessionsDir, 'index.json');
        this.ensureDirectories();
    }
    ensureDirectories() {
        fs.ensureDirSync(path.join(this.sessionsDir, 'active'));
        fs.ensureDirSync(path.join(this.sessionsDir, 'archived'));
        if (!fs.existsSync(this.indexPath)) {
            fs.writeJsonSync(this.indexPath, { sessions: [] });
        }
    }
    async save(session) {
        const sessionPath = path.join(this.sessionsDir, 'active', `${session.id}.json`);
        // Save session with proper date serialization
        const serializable = {
            ...session,
            created: session.created.toISOString(),
            updated: new Date().toISOString(),
            conversation: session.conversation.map(entry => ({
                ...entry,
                timestamp: entry.timestamp.toISOString()
            })),
            compressed: session.compressed.map(comp => ({
                ...comp,
                startTime: comp.startTime.toISOString(),
                endTime: comp.endTime.toISOString()
            }))
        };
        await fs.writeJson(sessionPath, serializable, { spaces: 2 });
        await this.updateIndex(session);
    }
    async load(sessionId) {
        const sessionPath = path.join(this.sessionsDir, 'active', `${sessionId}.json`);
        if (!fs.existsSync(sessionPath)) {
            // Check archived sessions
            const archived = await this.findInArchived(sessionId);
            if (archived) {
                return this.deserializeSession(archived);
            }
            return null;
        }
        const data = await fs.readJson(sessionPath);
        return this.deserializeSession(data);
    }
    async findMostRecent(projectPath) {
        const projectHash = this.hashPath(projectPath);
        const index = await fs.readJson(this.indexPath);
        const projectSessions = index.sessions
            .filter((s) => s.projectHash === projectHash)
            .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
        if (projectSessions.length === 0) {
            return null;
        }
        return this.load(projectSessions[0].id);
    }
    async listSessions(projectPath) {
        const index = await fs.readJson(this.indexPath);
        if (projectPath) {
            const projectHash = this.hashPath(projectPath);
            return index.sessions.filter((s) => s.projectHash === projectHash);
        }
        return index.sessions;
    }
    async archive(sessionId) {
        const sourcePath = path.join(this.sessionsDir, 'active', `${sessionId}.json`);
        if (!fs.existsSync(sourcePath)) {
            return;
        }
        const date = new Date().toISOString().split('T')[0];
        const archiveDir = path.join(this.sessionsDir, 'archived', date);
        fs.ensureDirSync(archiveDir);
        const destPath = path.join(archiveDir, `${sessionId}.json`);
        await fs.move(sourcePath, destPath);
        // Update index
        const index = await fs.readJson(this.indexPath);
        const sessionIndex = index.sessions.findIndex((s) => s.id === sessionId);
        if (sessionIndex >= 0) {
            index.sessions[sessionIndex].archived = true;
            index.sessions[sessionIndex].archivedDate = date;
            await fs.writeJson(this.indexPath, index, { spaces: 2 });
        }
    }
    async updateIndex(session) {
        const index = await fs.readJson(this.indexPath);
        const projectHash = this.hashPath(session.projectPath);
        const existingIndex = index.sessions.findIndex((s) => s.id === session.id);
        const sessionMeta = {
            id: session.id,
            projectPath: session.projectPath,
            projectHash,
            created: session.created.toISOString(),
            updated: new Date().toISOString(),
            messageCount: session.conversation.length,
            archived: false
        };
        if (existingIndex >= 0) {
            index.sessions[existingIndex] = sessionMeta;
        }
        else {
            index.sessions.push(sessionMeta);
        }
        await fs.writeJson(this.indexPath, index, { spaces: 2 });
    }
    hashPath(projectPath) {
        return crypto.createHash('sha256').update(projectPath).digest('hex').substring(0, 12);
    }
    deserializeSession(data) {
        return {
            ...data,
            created: new Date(data.created),
            updated: new Date(data.updated),
            conversation: data.conversation.map((entry) => ({
                ...entry,
                timestamp: new Date(entry.timestamp)
            })),
            compressed: data.compressed.map((comp) => ({
                ...comp,
                startTime: new Date(comp.startTime),
                endTime: new Date(comp.endTime)
            }))
        };
    }
    async findInArchived(sessionId) {
        const archiveDir = path.join(this.sessionsDir, 'archived');
        if (!fs.existsSync(archiveDir)) {
            return null;
        }
        const dates = await fs.readdir(archiveDir);
        for (const date of dates) {
            const sessionPath = path.join(archiveDir, date, `${sessionId}.json`);
            if (fs.existsSync(sessionPath)) {
                return await fs.readJson(sessionPath);
            }
        }
        return null;
    }
}
exports.SessionStorage = SessionStorage;
//# sourceMappingURL=session-storage.js.map