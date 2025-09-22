import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { Session, ConversationEntry } from './types';
import { getConfigDir } from '../config/path-utils';

export class SessionStorage {
  private sessionsDir: string;
  private indexPath: string;
  
  constructor() {
    const configDirs = getConfigDir();
    this.sessionsDir = path.join(configDirs.userPath, 'sessions');
    this.indexPath = path.join(this.sessionsDir, 'index.json');
    this.ensureDirectories();
  }
  
  private ensureDirectories(): void {
    fs.ensureDirSync(path.join(this.sessionsDir, 'active'));
    fs.ensureDirSync(path.join(this.sessionsDir, 'archived'));
    if (!fs.existsSync(this.indexPath)) {
      fs.writeJsonSync(this.indexPath, { sessions: [] });
    }
  }
  
  async save(session: Session): Promise<void> {
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
  
  async load(sessionId: string): Promise<Session | null> {
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
  
  async findMostRecent(projectPath: string): Promise<Session | null> {
    const projectHash = this.hashPath(projectPath);
    const index = await fs.readJson(this.indexPath);
    
    const projectSessions = index.sessions
      .filter((s: any) => s.projectHash === projectHash)
      .sort((a: any, b: any) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
    
    if (projectSessions.length === 0) {
      return null;
    }
    
    return this.load(projectSessions[0].id);
  }
  
  async listSessions(projectPath?: string): Promise<any[]> {
    const index = await fs.readJson(this.indexPath);
    
    if (projectPath) {
      const projectHash = this.hashPath(projectPath);
      return index.sessions.filter((s: any) => s.projectHash === projectHash);
    }
    
    return index.sessions;
  }
  
  async archive(sessionId: string): Promise<void> {
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
    const sessionIndex = index.sessions.findIndex((s: any) => s.id === sessionId);
    if (sessionIndex >= 0) {
      index.sessions[sessionIndex].archived = true;
      index.sessions[sessionIndex].archivedDate = date;
      await fs.writeJson(this.indexPath, index, { spaces: 2 });
    }
  }
  
  private async updateIndex(session: Session): Promise<void> {
    const index = await fs.readJson(this.indexPath);
    const projectHash = this.hashPath(session.projectPath);
    
    const existingIndex = index.sessions.findIndex((s: any) => s.id === session.id);
    
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
    } else {
      index.sessions.push(sessionMeta);
    }
    
    await fs.writeJson(this.indexPath, index, { spaces: 2 });
  }
  
  private hashPath(projectPath: string): string {
    return crypto.createHash('sha256').update(projectPath).digest('hex').substring(0, 12);
  }
  
  private deserializeSession(data: any): Session {
    return {
      ...data,
      created: new Date(data.created),
      updated: new Date(data.updated),
      conversation: data.conversation.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      })),
      compressed: data.compressed.map((comp: any) => ({
        ...comp,
        startTime: new Date(comp.startTime),
        endTime: new Date(comp.endTime)
      }))
    };
  }
  
  private async findInArchived(sessionId: string): Promise<any | null> {
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