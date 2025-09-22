import { v4 as uuidv4 } from 'uuid';
import { Session, ConversationEntry, SessionOptions, EnvironmentSnapshot } from './types';
import { SessionStorage } from './session-storage';
import { LoopMessage } from '../core/master-loop-v2';

export class ConversationManager {
  private currentSession: Session | null = null;
  private storage: SessionStorage;
  
  constructor() {
    this.storage = new SessionStorage();
  }
  
  async startSession(options: SessionOptions = {}): Promise<Session> {
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
    const session: Session = {
      id: uuidv4(),
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
  
  async continueSession(): Promise<Session | null> {
    const recent = await this.storage.findMostRecent(process.cwd());
    if (recent) {
      this.currentSession = recent;
      // Update environment to current state
      this.currentSession.environment = await this.captureEnvironment();
      return this.currentSession;
    }
    return null;
  }
  
  async addUserMessage(content: string): Promise<void> {
    if (!this.currentSession) {
      await this.startSession();
    }
    
    const entry: ConversationEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      role: 'user',
      content,
      tokenCount: this.estimateTokens(content)
    };
    
    this.currentSession!.conversation.push(entry);
    this.currentSession!.metadata.messageCount++;
    this.currentSession!.metadata.tokenCount += entry.tokenCount;
    
    await this.storage.save(this.currentSession!);
  }
  
  async addAssistantMessage(content: string, toolCalls?: any[]): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    
    const entry: ConversationEntry = {
      id: uuidv4(),
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
  
  async addSystemMessage(content: string): Promise<void> {
    if (!this.currentSession) {
      await this.startSession();
    }
    
    const entry: ConversationEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      role: 'system',
      content,
      tokenCount: this.estimateTokens(content)
    };
    
    this.currentSession!.conversation.push(entry);
    this.currentSession!.metadata.tokenCount += entry.tokenCount;
    
    await this.storage.save(this.currentSession!);
  }
  
  getConversationHistory(): LoopMessage[] {
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
  
  async clearConversation(): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    
    // Archive the current session
    await this.storage.archive(this.currentSession.id);
    
    // Start a new session
    this.currentSession = null;
    await this.startSession({ newSession: true });
  }
  
  getCurrentSession(): Session | null {
    return this.currentSession;
  }
  
  async listSessions(): Promise<any[]> {
    return this.storage.listSessions(process.cwd());
  }
  
  async loadSession(sessionId: string): Promise<Session | null> {
    const session = await this.storage.load(sessionId);
    if (session) {
      this.currentSession = session;
    }
    return session;
  }
  
  // Utility methods
  
  private estimateTokens(text: string): number {
    // Simple estimation: ~4 characters per token
    // In production, use a proper tokenizer like tiktoken
    return Math.ceil(text.length / 4);
  }
  
  private async captureEnvironment(): Promise<EnvironmentSnapshot> {
    const cwd = process.cwd();
    
    // Get CLAUDE.md content if it exists
    let claudeMd: string | undefined;
    try {
      const fs = require('fs-extra');
      const path = require('path');
      const claudeMdPath = path.join(cwd, 'CLAUDE.md');
      if (fs.existsSync(claudeMdPath)) {
        claudeMd = fs.readFileSync(claudeMdPath, 'utf-8');
      }
    } catch (error) {
      // Ignore errors
    }
    
    return {
      cwd,
      files: [], // TODO: Implement file tracking
      gitStatus: await this.getGitStatus(),
      envVars: this.getSanitizedEnvVars(),
      claudeMd
    };
  }
  
  private async getGitStatus(): Promise<any> {
    try {
      const { execSync } = require('child_process');
      const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
      return { branch, modified: [], staged: [], untracked: [] };
    } catch (error) {
      return undefined;
    }
  }
  
  private getSanitizedEnvVars(): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const allowedKeys = ['NODE_ENV', 'LLM_PROVIDER', 'PWD', 'USER', 'HOME'];
    
    for (const key of allowedKeys) {
      if (process.env[key]) {
        sanitized[key] = process.env[key];
      }
    }
    
    return sanitized;
  }
}