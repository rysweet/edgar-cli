export declare enum SubagentType {
    GENERAL_PURPOSE = "general-purpose",
    BUILDER = "builder",
    ARCHITECT = "architect",
    REVIEWER = "reviewer",
    TESTER = "tester",
    OPTIMIZER = "optimizer",
    DATABASE = "database",
    SECURITY = "security",
    API_DESIGNER = "api-designer",
    CI_DIAGNOSTIC = "ci-diagnostic",
    CLEANUP = "cleanup",
    PATTERNS = "patterns",
    PROMPT_WRITER = "prompt-writer",
    ANALYZER = "analyzer",
    INTEGRATION = "integration",
    IMPROVEMENT_WORKFLOW = "improvement-workflow",
    AMBIGUITY = "ambiguity",
    PREFERENCE_REVIEWER = "preference-reviewer",
    PRE_COMMIT_DIAGNOSTIC = "pre-commit-diagnostic",
    OUTPUT_STYLE_SETUP = "output-style-setup",
    STATUSLINE_SETUP = "statusline-setup"
}
export interface SubagentConfig {
    type: SubagentType;
    name: string;
    description: string;
    tools: string[];
    specializations?: string[];
    philosophy?: string;
}
export interface SubagentTask {
    description: string;
    prompt: string;
    subagent_type: SubagentType;
}
export interface SubagentResult {
    success: boolean;
    message: string;
    output?: any;
    error?: string;
}
export declare const SUBAGENT_CONFIGS: Map<SubagentType, SubagentConfig>;
//# sourceMappingURL=subagent-types.d.ts.map