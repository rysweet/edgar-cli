import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

export interface Session {
  id: string;
  created: Date;
  updated: Date;
  messages: Message[];
  context?: any;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export class SessionManager {
  private sessionsDir: string;
  private currentSession: Session | null = null;

  constructor() {
    this.sessionsDir = path.join(os.homedir(), '.edgar', 'sessions');
    this.ensureSessionsDirectory();
  }

  private ensureSessionsDirectory(): void {
    fs.ensureDirSync(this.sessionsDir);
  }

  public async createSession(): Promise<Session> {
    const session: Session = {
      id: this.generateSessionId(),
      created: new Date(),
      updated: new Date(),
      messages: []
    };

    this.currentSession = session;
    await this.saveSession(session);
    return session;
  }

  public async continueSession(): Promise<Session> {
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

  public async resumeSession(): Promise<Session> {
    // For now, this is the same as continue
    // In the future, this could show a list of sessions to choose from
    return this.continueSession();
  }

  public async clearCurrentSession(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.messages = [];
      this.currentSession.updated = new Date();
      await this.saveSession(this.currentSession);
    }
  }

  public async addMessage(message: Message): Promise<void> {
    if (!this.currentSession) {
      await this.createSession();
    }

    this.currentSession!.messages.push(message);
    this.currentSession!.updated = new Date();
    await this.saveSession(this.currentSession!);
  }

  public getCurrentSession(): Session | null {
    return this.currentSession;
  }

  private async saveSession(session: Session): Promise<void> {
    const sessionPath = path.join(this.sessionsDir, `${session.id}.json`);
    await fs.writeJson(sessionPath, session, { spaces: 2 });
  }

  private async getAllSessions(): Promise<Session[]> {
    const files = await fs.readdir(this.sessionsDir);
    const sessions: Session[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const sessionPath = path.join(this.sessionsDir, file);
        try {
          const session = await fs.readJson(sessionPath);
          // Convert date strings back to Date objects
          session.created = new Date(session.created);
          session.updated = new Date(session.updated);
          session.messages.forEach((msg: Message) => {
            msg.timestamp = new Date(msg.timestamp);
          });
          sessions.push(session);
        } catch (error) {
          console.error(`Error loading session ${file}:`, error);
        }
      }
    }

    return sessions;
  }

  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `session_${timestamp}_${random}`;
  }
}