"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputStyleFormatter = exports.DEFAULT_OUTPUT_STYLES = void 0;
exports.DEFAULT_OUTPUT_STYLES = new Map([
    ['concise', {
            name: 'concise',
            description: 'Minimal, direct responses without unnecessary elaboration',
            rules: [
                { type: 'formatting', rule: 'Keep responses to 1-3 sentences maximum' },
                { type: 'behavior', rule: 'Answer directly without preamble or postamble' },
                { type: 'behavior', rule: 'Avoid explanations unless explicitly requested' },
                { type: 'constraint', rule: 'No emojis or decorative formatting' }
            ],
            examples: [
                { input: 'What is 2+2?', output: '4' },
                { input: 'How do I list files?', output: 'Use `ls` command.' }
            ]
        }],
    ['detailed', {
            name: 'detailed',
            description: 'Comprehensive responses with explanations and context',
            rules: [
                { type: 'formatting', rule: 'Provide thorough explanations with examples' },
                { type: 'behavior', rule: 'Include context and reasoning for suggestions' },
                { type: 'behavior', rule: 'Anticipate follow-up questions' },
                { type: 'language', rule: 'Use clear technical language with definitions' }
            ],
            examples: [
                {
                    input: 'What is 2+2?',
                    output: 'The sum of 2 and 2 is 4. This is basic arithmetic addition where we combine two groups of 2 units each, resulting in a total of 4 units.'
                }
            ]
        }],
    ['socratic', {
            name: 'socratic',
            description: 'Guide through questions rather than direct answers',
            rules: [
                { type: 'behavior', rule: 'Respond with guiding questions when appropriate' },
                { type: 'behavior', rule: 'Help users discover solutions themselves' },
                { type: 'language', rule: 'Use encouraging and exploratory language' },
                { type: 'constraint', rule: 'Only provide direct answers for factual queries' }
            ],
            examples: [
                {
                    input: 'How should I structure this function?',
                    output: 'What are the main responsibilities this function needs to handle? Have you considered how to separate concerns?'
                }
            ]
        }],
    ['technical', {
            name: 'technical',
            description: 'Precise technical communication with code focus',
            rules: [
                { type: 'formatting', rule: 'Use code blocks and technical terminology' },
                { type: 'behavior', rule: 'Prioritize accuracy and correctness' },
                { type: 'language', rule: 'Use industry-standard terminology' },
                { type: 'constraint', rule: 'Include relevant technical specifications' }
            ]
        }],
    ['tutorial', {
            name: 'tutorial',
            description: 'Step-by-step instructional format',
            rules: [
                { type: 'formatting', rule: 'Use numbered steps for processes' },
                { type: 'behavior', rule: 'Include prerequisites and expected outcomes' },
                { type: 'behavior', rule: 'Provide checkpoints for validation' },
                { type: 'language', rule: 'Use clear, instructional language' }
            ]
        }]
]);
class OutputStyleFormatter {
    currentStyle;
    constructor(style) {
        this.currentStyle = style || exports.DEFAULT_OUTPUT_STYLES.get('concise');
    }
    setStyle(style) {
        this.currentStyle = style;
    }
    getStyle() {
        return this.currentStyle;
    }
    formatSystemPrompt(basePrompt) {
        let formattedPrompt = basePrompt + '\n\n';
        formattedPrompt += `# Output Style: ${this.currentStyle.name}\n`;
        if (this.currentStyle.description) {
            formattedPrompt += `${this.currentStyle.description}\n\n`;
        }
        formattedPrompt += '## Output Rules:\n';
        for (const rule of this.currentStyle.rules) {
            const priority = rule.priority ? ` [${rule.priority.toUpperCase()}]` : '';
            formattedPrompt += `- ${rule.rule}${priority}\n`;
        }
        if (this.currentStyle.examples && this.currentStyle.examples.length > 0) {
            formattedPrompt += '\n## Examples:\n';
            for (const example of this.currentStyle.examples) {
                formattedPrompt += `Input: ${example.input}\n`;
                formattedPrompt += `Output: ${example.output}\n`;
                if (example.explanation) {
                    formattedPrompt += `Explanation: ${example.explanation}\n`;
                }
                formattedPrompt += '\n';
            }
        }
        return formattedPrompt;
    }
    applyStyle(response) {
        // This could apply post-processing based on style rules
        // For now, return as-is since formatting happens at LLM level
        return response;
    }
}
exports.OutputStyleFormatter = OutputStyleFormatter;
//# sourceMappingURL=output-style.js.map