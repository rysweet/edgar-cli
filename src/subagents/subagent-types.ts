export enum SubagentType {
  GENERAL_PURPOSE = 'general-purpose',
  BUILDER = 'builder',
  ARCHITECT = 'architect',
  REVIEWER = 'reviewer',
  TESTER = 'tester',
  OPTIMIZER = 'optimizer',
  DATABASE = 'database',
  SECURITY = 'security',
  API_DESIGNER = 'api-designer',
  CI_DIAGNOSTIC = 'ci-diagnostic',
  CLEANUP = 'cleanup',
  PATTERNS = 'patterns',
  PROMPT_WRITER = 'prompt-writer',
  ANALYZER = 'analyzer',
  INTEGRATION = 'integration',
  IMPROVEMENT_WORKFLOW = 'improvement-workflow',
  AMBIGUITY = 'ambiguity',
  PREFERENCE_REVIEWER = 'preference-reviewer',
  PRE_COMMIT_DIAGNOSTIC = 'pre-commit-diagnostic',
  OUTPUT_STYLE_SETUP = 'output-style-setup',
  STATUSLINE_SETUP = 'statusline-setup'
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

export const SUBAGENT_CONFIGS: Map<SubagentType, SubagentConfig> = new Map([
  [SubagentType.GENERAL_PURPOSE, {
    type: SubagentType.GENERAL_PURPOSE,
    name: 'General Purpose',
    description: 'General-purpose agent for researching complex questions and executing multi-step tasks',
    tools: ['*'],
    philosophy: 'Thorough research and systematic task completion'
  }],
  [SubagentType.BUILDER, {
    type: SubagentType.BUILDER,
    name: 'Builder',
    description: 'Primary implementation agent. Builds code from specifications following modular philosophy',
    tools: ['*'],
    philosophy: 'Create self-contained, regeneratable modules with ruthless simplicity'
  }],
  [SubagentType.ARCHITECT, {
    type: SubagentType.ARCHITECT,
    name: 'Architect',
    description: 'Primary architecture and design agent. Creates specifications for implementation',
    tools: ['*'],
    philosophy: 'Embodies ruthless simplicity in system design'
  }],
  [SubagentType.REVIEWER, {
    type: SubagentType.REVIEWER,
    name: 'Reviewer',
    description: 'Code review and debugging specialist. Finds issues and suggests improvements',
    tools: ['*'],
    philosophy: 'Systematic issue detection and quality assurance'
  }],
  [SubagentType.TESTER, {
    type: SubagentType.TESTER,
    name: 'Tester',
    description: 'Test coverage expert following testing pyramid (60% unit, 30% integration, 10% E2E)',
    tools: ['*'],
    philosophy: 'Comprehensive test coverage and test-driven development'
  }],
  [SubagentType.OPTIMIZER, {
    type: SubagentType.OPTIMIZER,
    name: 'Optimizer',
    description: 'Performance optimization specialist. Measures twice, optimizes once',
    tools: ['*'],
    philosophy: 'Data-driven performance improvements'
  }],
  [SubagentType.DATABASE, {
    type: SubagentType.DATABASE,
    name: 'Database',
    description: 'Database design and optimization specialist',
    tools: ['*'],
    specializations: ['schema design', 'query optimization', 'migrations', 'data architecture']
  }],
  [SubagentType.SECURITY, {
    type: SubagentType.SECURITY,
    name: 'Security',
    description: 'Security specialist for authentication, authorization, encryption, and vulnerability assessment',
    tools: ['*'],
    philosophy: 'Never compromise on security fundamentals'
  }],
  [SubagentType.API_DESIGNER, {
    type: SubagentType.API_DESIGNER,
    name: 'API Designer',
    description: 'API contract specialist. Designs minimal, clear REST/GraphQL APIs',
    tools: ['*'],
    philosophy: 'Bricks & studs philosophy for API design'
  }],
  [SubagentType.CI_DIAGNOSTIC, {
    type: SubagentType.CI_DIAGNOSTIC,
    name: 'CI Diagnostic',
    description: 'CI workflow orchestrator. Manages full CI diagnostic and fix cycle',
    tools: ['*'],
    specializations: ['monitoring', 'diagnostics', 'fixes', 'iteration']
  }],
  [SubagentType.CLEANUP, {
    type: SubagentType.CLEANUP,
    name: 'Cleanup',
    description: 'Post-task cleanup specialist. Reviews git status and removes unnecessary complexity',
    tools: ['*'],
    philosophy: 'Maintain pristine codebase state'
  }],
  [SubagentType.PATTERNS, {
    type: SubagentType.PATTERNS,
    name: 'Patterns',
    description: 'Pattern emergence orchestrator. Detects emergent patterns from diverse perspectives',
    tools: ['*'],
    philosophy: 'Identify unexpected patterns through productive tensions'
  }],
  [SubagentType.PROMPT_WRITER, {
    type: SubagentType.PROMPT_WRITER,
    name: 'Prompt Writer',
    description: 'Generates high-quality, structured prompts with complexity assessment',
    tools: ['*'],
    philosophy: 'Create clear, actionable prompts'
  }],
  [SubagentType.ANALYZER, {
    type: SubagentType.ANALYZER,
    name: 'Analyzer',
    description: 'Multi-mode analysis engine. Selects TRIAGE, DEEP, or SYNTHESIS based on context',
    tools: ['*'],
    specializations: ['rapid filtering', 'thorough analysis', 'source synthesis']
  }],
  [SubagentType.INTEGRATION, {
    type: SubagentType.INTEGRATION,
    name: 'Integration',
    description: 'Integration specialist for APIs, services, and system connections',
    tools: ['*'],
    philosophy: 'Clean interfaces and reliable communication'
  }],
  [SubagentType.IMPROVEMENT_WORKFLOW, {
    type: SubagentType.IMPROVEMENT_WORKFLOW,
    name: 'Improvement Workflow',
    description: 'Enforces progressive validation throughout improvement process',
    tools: ['*'],
    philosophy: 'Prevent complexity creep through staged validation'
  }],
  [SubagentType.AMBIGUITY, {
    type: SubagentType.AMBIGUITY,
    name: 'Ambiguity',
    description: 'Ambiguity guardian. Preserves productive contradictions and navigates uncertainty',
    tools: ['*'],
    philosophy: 'Uncertainty as valuable knowledge feature'
  }],
  [SubagentType.PREFERENCE_REVIEWER, {
    type: SubagentType.PREFERENCE_REVIEWER,
    name: 'Preference Reviewer',
    description: 'Analyzes user preferences to identify patterns for upstream contribution',
    tools: ['*']
  }],
  [SubagentType.PRE_COMMIT_DIAGNOSTIC, {
    type: SubagentType.PRE_COMMIT_DIAGNOSTIC,
    name: 'Pre-commit Diagnostic',
    description: 'Pre-commit workflow specialist. Resolves local issues before pushing',
    tools: ['*'],
    specializations: ['hook failures', 'formatting', 'linting', 'committability']
  }],
  [SubagentType.OUTPUT_STYLE_SETUP, {
    type: SubagentType.OUTPUT_STYLE_SETUP,
    name: 'Output Style Setup',
    description: 'Creates and manages Claude Code output styles',
    tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep']
  }],
  [SubagentType.STATUSLINE_SETUP, {
    type: SubagentType.STATUSLINE_SETUP,
    name: 'Statusline Setup',
    description: 'Configures user statusline settings',
    tools: ['Read', 'Edit']
  }]
]);