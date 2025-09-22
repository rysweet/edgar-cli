import { Session, SessionOptions } from './types';
import { LoopMessage } from '../core/master-loop-v2';
export declare class ConversationManager {
    private currentSession;
    private storage;
    constructor();
    startSession(options?: SessionOptions): Promise<Session>;
    continueSession(): Promise<Session | null>;
    addUserMessage(content: string): Promise<void>;
    addAssistantMessage(content: string, toolCalls?: any[]): Promise<void>;
    addSystemMessage(content: string): Promise<void>;
    getConversationHistory(): LoopMessage[];
    clearConversation(): Promise<void>;
    getCurrentSession(): Session | null;
    listSessions(): Promise<any[]>;
    loadSession(sessionId: string): Promise<Session | null>;
    private estimateTokens;
    private captureEnvironment;
    private getGitStatus;
    private getSanitizedEnvVars;
}
//# sourceMappingURL=conversation-manager.d.ts.map