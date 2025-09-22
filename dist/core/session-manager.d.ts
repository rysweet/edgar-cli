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
export declare class SessionManager {
    private sessionsDir;
    private currentSession;
    constructor();
    private ensureSessionsDirectory;
    createSession(): Promise<Session>;
    continueSession(): Promise<Session>;
    resumeSession(): Promise<Session>;
    clearCurrentSession(): Promise<void>;
    addMessage(message: Message): Promise<void>;
    getCurrentSession(): Session | null;
    private saveSession;
    private getAllSessions;
    private generateSessionId;
}
//# sourceMappingURL=session-manager.d.ts.map