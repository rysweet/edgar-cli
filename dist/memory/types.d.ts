export interface Session {
    id: string;
    projectPath: string;
    created: Date;
    updated: Date;
    metadata: SessionMetadata;
    conversation: ConversationEntry[];
    environment: EnvironmentSnapshot;
    compressed: CompressedHistory[];
}
export interface SessionMetadata {
    version: string;
    tokenCount: number;
    messageCount: number;
    toolCallCount: number;
    lastCommand?: string;
    tags: string[];
}
export interface ConversationEntry {
    id: string;
    timestamp: Date;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    tokenCount: number;
    toolCalls?: any[];
    toolResults?: any[];
    environmentDelta?: EnvironmentDelta;
}
export interface EnvironmentSnapshot {
    cwd: string;
    files: FileSnapshot[];
    gitStatus?: GitStatus;
    envVars: Record<string, string>;
    claudeMd?: string;
}
export interface FileSnapshot {
    path: string;
    modified: Date;
    size: number;
    hash?: string;
}
export interface GitStatus {
    branch?: string;
    modified: string[];
    staged: string[];
    untracked: string[];
}
export interface EnvironmentDelta {
    cwdChanged: boolean;
    filesModified: string[];
    gitChanges?: any;
    envChanges?: Record<string, any>;
}
export interface CompressedHistory {
    id: string;
    startTime: Date;
    endTime: Date;
    summary: string;
    keyPoints: string[];
    tokensSaved: number;
    originalEntries: string[];
}
export interface SessionOptions {
    continue?: boolean;
    sessionId?: string;
    newSession?: boolean;
}
//# sourceMappingURL=types.d.ts.map