export interface OutputStyle {
    name: string;
    description?: string;
    rules: OutputRule[];
    examples?: OutputExample[];
    metadata?: Record<string, any>;
}
export interface OutputRule {
    type: 'formatting' | 'behavior' | 'language' | 'constraint';
    rule: string;
    priority?: 'high' | 'medium' | 'low';
}
export interface OutputExample {
    input: string;
    output: string;
    explanation?: string;
}
export interface OutputStyleConfig {
    activeStyle?: string;
    styles: Map<string, OutputStyle>;
    defaultStyle?: OutputStyle;
}
export declare const DEFAULT_OUTPUT_STYLES: Map<string, OutputStyle>;
export declare class OutputStyleFormatter {
    private currentStyle;
    constructor(style?: OutputStyle);
    setStyle(style: OutputStyle): void;
    getStyle(): OutputStyle;
    formatSystemPrompt(basePrompt: string): string;
    applyStyle(response: string): string;
}
//# sourceMappingURL=output-style.d.ts.map