import { Session } from './types';
export declare class SessionStorage {
    private sessionsDir;
    private indexPath;
    constructor();
    private ensureDirectories;
    save(session: Session): Promise<void>;
    load(sessionId: string): Promise<Session | null>;
    findMostRecent(projectPath: string): Promise<Session | null>;
    listSessions(projectPath?: string): Promise<any[]>;
    archive(sessionId: string): Promise<void>;
    private updateIndex;
    private hashPath;
    private deserializeSession;
    private findInArchived;
    private writeJsonAtomic;
    private writeJsonAtomicSync;
    private readJsonSafe;
}
//# sourceMappingURL=session-storage.d.ts.map